# MedSupply — Orders Backend Architecture Proposal

> Analysis and design proposal only. This document does not define or execute SQL migrations.

## 1. Current architecture assessment

MedSupply currently has:

- `Database`, an abstract synchronous/async database interface.
- `MockDatabase`, retained for isolated testing.
- `ProviderAwareDatabase`, which preserves the existing dependency-injection architecture and delegates provider/catalog operations to `SupabaseProviderDatabase`.
- `SupabaseProviderDatabase`, containing Supabase provider, product, and specialty operations.
- A local/transient cart with a mutation queue and latest-cart reference.
- Temporary local React-state orders.
- Admin and Pharmacist order layouts that read local `AppState.orders`.
- Temporary MockDatabase stock approval behavior.

Existing Supabase foundation includes:

- Profiles and authentication roles
- Pharmacist account statuses
- Stores
- Manufacturers
- Specialties
- Provider products
- Provider CRUD and product CRUD RLS

There is currently no Supabase order schema, order RPC, or persistent order state.

The migration should preserve:

- `Database` and `ProviderAwareDatabase`
- Existing data models where practical
- MockDatabase for isolated tests
- Local/transient cart behavior
- Existing cart serialization
- Existing UI/navigation

It should replace only temporary order creation, status, and stock-deduction behavior.

---

## 2. Proposed database schema

### 2.1 Stores and Manufacturers

Add one provider-specific field to both existing tables:

```text
minimum_order_value numeric(12,2) NOT NULL DEFAULT 0
```

Constraints:

- `minimum_order_value >= 0`
- Zero means no minimum.
- Existing provider status and soft-deletion behavior remain unchanged.

Add matching application fields:

- `Store.minimumOrderValue`
- `Factory.minimumOrderValue`
- `StoreInput.minimumOrderValue`
- `ManufacturerInput.minimumOrderValue`

### 2.2 `orders`

The order is the aggregate record for one pharmacist submission.

| Column | Type | Purpose |
|---|---|---|
| `id` | `uuid` | Primary key |
| `pharmacist_id` | `uuid` | Auth/profile owner |
| `status` | enum | `pending`, `approved`, `rejected`, `completed` |
| `total_items` | integer | Total quantity |
| `subtotal_amount` | numeric(12,2) | Total before discounts |
| `discount_amount` | numeric(12,2) | Discount amount |
| `total_amount` | numeric(12,2) | Final payable total after discounts |
| `rejection_reason` | text | Required for rejection |
| `stock_deducted` | boolean | Prevents repeated deductions |
| `created_at` | timestamptz | Submission time |
| `approved_at` | timestamptz | Approval time |
| `rejected_at` | timestamptz | Rejection time |
| `completed_at` | timestamptz | Completion time |
| `updated_at` | timestamptz | Last status change |

Recommended constraints:

- `pharmacist_id` references `profiles(id)` with `on delete restrict`.
- All totals and quantities are non-negative.
- `stock_deducted` is true only after approval.
- Rejection and approval timestamps correspond to status.
- Physical order deletion is not needed.

### 2.3 `order_provider_groups`

This table represents provider grouping and snapshots the provider subtotal/minimum rule.

| Column | Type | Purpose |
|---|---|---|
| `id` | `uuid` | Primary key |
| `order_id` | `uuid` | Parent order |
| `provider_type` | enum | `store` or `manufacturer` |
| `store_id` | nullable `uuid` | Store reference, where applicable |
| `manufacturer_id` | nullable `uuid` | Manufacturer reference, where applicable |
| `provider_name` | text | Provider-name snapshot |
| `minimum_order_value_snapshot` | numeric(12,2) | Applicable minimum at submission |
| `subtotal_before_discount_snapshot` | numeric(12,2) | Provider subtotal before discounts |
| `subtotal_after_discount_snapshot` | numeric(12,2) | Provider subtotal after discounts |
| `item_count` | integer | Quantity or line count |
| `created_at` | timestamptz | Submission time |

Recommended constraints:

- Exactly one of `store_id` or `manufacturer_id` is non-null.
- Minimum and subtotal values are non-negative.
- Provider snapshots are unique per order/provider combination.
- Provider foreign keys should use `on delete restrict`; provider names remain readable from snapshots even if a provider is later deactivated or soft-deleted.

This table is recommended because minimum totals and provider subtotal snapshots belong to the order rather than the order itself or individual lines.

### 2.4 `order_items`

| Column | Type | Purpose |
|---|---|---|
| `id` | `uuid` | Primary key |
| `order_id` | `uuid` | Parent order |
| `provider_group_id` | `uuid` | Provider group |
| `product_id` | nullable `uuid` | Optional live reorder reference |
| `product_name` | text | Historical product name |
| `dosage` | text | Historical dosage |
| `package_size` | text | Historical package size |
| `variant` | text | Historical variant |
| `specialty_name` | text | Historical category name |
| `consumer_unit_price` | numeric(12,2) | Historical consumer price |
| `discount_percentage` | numeric(5,2) | Historical discount |
| `final_unit_price` | numeric(12,2) | Historical pharmacist price |
| `quantity` | integer | Ordered quantity |
| `line_subtotal_before_discount` | numeric(12,2) | Historical pre-discount subtotal |
| `line_subtotal_after_discount` | numeric(12,2) | Historical final subtotal |
| `created_at` | timestamptz | Submission time |

Recommended constraints:

- `quantity > 0`
- Prices and subtotals are non-negative
- Discount is from `0` to `100`
- `provider_group_id` belongs to the same `order_id`
- `product_id` should be nullable and should be used only for reorder references

A live foreign key is not required for historical rendering and could prevent preservation if product records are removed physically.

### 2.5 Recommended indexes

- `orders(pharmacist_id, created_at desc)`
- `orders(status, created_at desc)`
- `order_provider_groups(order_id)`
- `order_provider_groups(store_id)`
- `order_provider_groups(manufacturer_id)`
- `order_items(order_id)`
- `order_items(product_id)`

No additional table is necessary for the described lifecycle.

---

## 3. Order lifecycle

### Allowed transitions

```text
pending -> approved
pending -> rejected
approved -> completed
```

### Disallowed transitions

- `approved -> rejected`
- `rejected -> approved`
- `rejected -> completed`
- `completed -> any state`
- A second approval
- A second stock deduction
- Direct client status changes

### Lifecycle meanings

1. Pharmacist submits order as `pending`.
2. Admin approves the whole order:
   - Stock is validated and deducted once.
   - Order becomes `approved`.
   - `stock_deducted` becomes true.
3. Admin rejects the whole pending order:
   - No stock is deducted.
   - Rejection reason and timestamp are stored.
4. Admin completes the whole approved order:
   - No additional stock deduction occurs.
   - Completion timestamp is stored.

All order-level actions apply to the complete order, never only one provider group.

---

## 4. Provider-specific minimum order validation

### Recommended subtotal basis

Check the **post-discount final pharmacist subtotal**:

```text
group_subtotal = sum(final_unit_price * quantity)
remaining = max(minimum_order_value - group_subtotal, 0)
valid = group_subtotal >= minimum_order_value
```

This is recommended because:

- It reflects the actual pharmacist payable amount.
- It matches existing cart line totals and `pharmacyPriceAfterDiscount`.
- It avoids a provider minimum changing meaning when discount rules change.
- It provides consistent client and server calculations.

Zero means no minimum.

### Enforcement layers

1. Checkout must calculate and display each provider subtotal, minimum, remaining amount, and failure state.
2. `create_order` must independently calculate and validate every provider group from live records.
3. The RPC must snapshot the minimum and subtotals in `order_provider_groups`.
4. Future provider minimum changes must not alter existing orders.

The client should only preview submission. It must never supply:

- Provider minimum snapshots
- Provider subtotal snapshots
- Order total
- Discount total
- Final unit prices
- Stock-deducted state
- Status

---

## 5. Transactional stock approval design

## Recommended RPC

Implement a `approve_order(p_order_id uuid)` PostgreSQL RPC.

The RPC should:

- Verify the caller is Admin.
- Verify the order is pending.
- Verify `stock_deducted = false`.
- Lock the order row.
- Lock each affected provider-product row.
- Aggregate duplicate product quantities.
- Validate all products before updating anything.
- Deduct stock and update status in one transaction.

### Transaction sequence

1. Verify `auth.uid()` is an active Admin profile.
2. Execute transactionally:

```text
BEGIN
```

3. Lock the order:

```text
SELECT ... FROM orders WHERE id = p_order_id FOR UPDATE
```

4. Validate status and stock-deduction state.
5. Read and lock required `provider_products` rows with `FOR UPDATE`.
6. Aggregate quantities per product.
7. Validate every row:
   - Product exists
   - Product is not soft-deleted
   - Product is available
   - Stock is sufficient
   - Provider is active and not soft-deleted
   - Provider and product ownership match the order snapshot
8. If any validation fails:
   - Raise an error
   - Roll back every change
9. Deduct stock for all validated products.
10. Set `is_available = false` if stock reaches zero.
11. Update the order:

```text
status = approved
stock_deducted = true
approved_at = now()
```

12. Commit atomically.

### Concurrency safety

- `FOR UPDATE` on the order prevents concurrent duplicate approval.
- `FOR UPDATE` on product rows serializes stock changes.
- PostgreSQL transactions guarantee all-or-nothing deductions.
- A second approval waits for or sees the final locked order state and fails safely.

### Additional RPCs

Recommended, all as RPCs:

- `create_order(p_items jsonb)`
- `approve_order(p_order_id uuid)`
- `reject_order(p_order_id uuid, p_reason text)`
- `complete_order(p_order_id uuid)`

A read-only `quote_order(p_items jsonb)` RPC is useful for checkout preview but must not reserve or deduct stock.

---

## 6. RLS and security

### `orders`

- Pharmacist `SELECT`: only `pharmacist_id = auth.uid()`.
- Admin `SELECT`: all orders.
- Clients should have no direct insert, update, or delete policy.
- Order creation and status transitions occur through RPCs.

### `order_provider_groups`

- Pharmacist `SELECT`: only through an order owned by `auth.uid()`.
- Admin `SELECT`: all.
- No direct client insert/update/delete.

### `order_items`

- Pharmacist `SELECT`: only through an owned order.
- Admin `SELECT`: all.
- No direct client insert/update/delete.

### RPC authorization

- `create_order` / `quote_order`: active authenticated Pharmacist.
- `approve_order` / `reject_order` / `complete_order`: active Admin only.

The RPCs should independently verify role and account status. UI role checks are not sufficient.

### Direct privileges

- Revoke direct insert/update/delete privileges from `authenticated` where possible.
- Grant select privileges only.
- Grant execute on the narrow order RPC set.
- Revoke stock-table mutation privileges from clients.
- Keep stock mutations inside `approve_order`.

---

## 7. Historical snapshot design

Historical rendering should use only `orders`, `order_provider_groups`, and `order_items`.

The snapshots must include:

- Product name
- Dosage
- Package/variant
- Specialty/category name
- Provider name
- Provider type
- Consumer unit price
- Discount percentage
- Final unit price
- Quantity
- Before/after line subtotals
- Provider minimum
- Provider before/after subtotal

The UI must not depend on live product/provider rows for historical order display.

Reorder is the one intentional live-reference operation:

1. Read historical product IDs and quantities.
2. Fetch current product/provider records.
3. Reject inactive, unavailable, deleted, or missing products.
4. Add valid products to the local transient cart.
5. Apply current provider minimum values to the new order.

Existing historical orders remain unchanged.

---

## 8. Required application changes

## 8.1 Models and data types

Affected:

- `src/app/models/data_types.ts`
- `src/app/models/database.ts`
- `src/app/models/ioc_container.ts`
- `src/app/models/supabase_database.ts`

Required additions:

- Minimum order value in Store/Factory models and inputs
- Provider subtotal/order group types
- Server-returned order quote types
- Order list/detail async methods
- Approve/reject/complete async methods
- Historical snapshot fields

Avoid introducing a separate order repository or duplicate order model.

## 8.2 Provider forms

Affected:

- `src/app/layouts/store_form_layout/index.tsx`
- `src/app/layouts/manufacturer_form_layout/index.tsx`

Add:

- Minimum order value input
- Numeric validation
- Negative-value rejection
- Zero allowed
- Async create/update mapping

## 8.3 Checkout

Affected:

- `src/app/state/app_state.tsx`
- `src/app/layouts/checkout_layout/index.tsx`

Display for each provider group:

- Provider name/type
- Post-discount subtotal
- Minimum order value
- Remaining amount
- Validation failure

Call `quote_order` for preview and `create_order` for submission.

Preserve:

- Local/transient cart
- Cart mutation serialization
- Existing checkout UI
- Existing provider grouping visualization

## 8.4 Pharmacist orders

Affected:

- `src/app/layouts/orders_layout/index.tsx`
- `src/app/state/app_state.tsx`

Replace local order state with async order history and snapshot detail reads.

Reorder should remain a local cart operation after server-backed current-product validation.

## 8.5 Admin orders

Affected:

- `src/app/layouts/admin_orders_layout/index.tsx`
- `src/app/layouts/admin_order_detail_layout/index.tsx`
- `src/app/state/app_state.tsx`

Replace local status mutation with RPC calls:

- `approve_order`
- `reject_order`
- `complete_order`

Refresh order state after each RPC result.

---

## 9. Incremental implementation plan

### Step 1 — Provider minimum values

- Add minimum-order columns
- Update models/forms/Supabase mappings
- Add DB constraints
- Add client validation

No order tables yet.

### Step 2 — Order schema and RLS

- Create enums
- Create `orders`
- Create `order_provider_groups`
- Create `order_items`
- Add timestamps, constraints, and indexes
- Add RLS policies

No direct client write access.

### Step 3 — Secure order creation

- Implement `quote_order`
- Implement `create_order`
- Recalculate products, prices, stock, provider status, and provider minimums server-side
- Insert provider snapshots and item snapshots transactionally

### Step 4 — Checkout migration

- Add provider minimum display and remaining amount
- Use quote RPC for preview
- Use create RPC for submission
- Preserve local/transient cart and serialization

### Step 5 — Order history reads

- Migrate Pharmacist order list/details
- Migrate Admin order list/details
- Render historical data exclusively from snapshots

### Step 6 — Approval RPC

- Implement transactional `approve_order`
- Lock order/product rows
- Validate stock/provider/status
- Deduct once
- Mark approved atomically

### Step 7 — Reject and complete RPCs

- Implement reject RPC with required reason
- Implement complete RPC with approved-only transition
- No stock deduction on rejection/completion

### Step 8 — Reorder migration

- Validate current product/provider availability
- Reapply current provider minimum values to the new order
- Leave old order snapshots unchanged
- Continue using local cart until order persistence is complete

### Step 9 — Remove temporary local behavior

- Remove local order creation
- Remove MockDatabase approval/deduction behavior
- Remove temporary local order state
- Preserve MockDatabase only for test isolation
- Keep cart local/transient

---

## 10. Risks and edge cases

### Minimum-order rule

- Minimum changes after submission do not affect historical orders.
- Existing provider rows need a migration default; zero is recommended.
- Post-discount subtotal is the recommended test basis.

### Stock

- Concurrent approvals serialize on order/product locks.
- Rejection does not deduct stock.
- Approval failure rolls back every deduction and status change.
- Reapproval is prevented by status and `stock_deducted`.

### Provider availability

- Creation or approval should fail if a provider is inactive/deleted.
- Existing historical snapshots remain readable.

### Product availability

- Soft-deleted products should not be recreated or approved.
- Reorder should report unavailable products explicitly.

### Price changes

- The server recalculates prices at submission.
- Existing cart items may trigger a price-change issue.
- Historical order snapshots remain unchanged.

### Order history

- Orders and snapshots remain durable even if products/providers later change.
- `product_id` on order items is only an optional reorder reference and not a historical rendering dependency.

### Reorder

- Reorder adds current products to the local cart.
- Stock and provider status must be revalidated.
- Current provider minimums apply to the new order.

### Missing information

The following details should be confirmed before implementation:

- Whether zero should be the migration default for existing providers.
- Whether rejected/completed orders remain permanently readable.
- Whether order-item duplicates are allowed or merged.
- Whether provider minimums apply to post-discount or pre-discount totals.

The proposal recommends post-discount minimum calculation and permanent historical snapshots.
