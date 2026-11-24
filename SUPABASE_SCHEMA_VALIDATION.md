# MedSupply Supabase Schema — Final Risk Validation

**Status:** Targeted technical review complete. No implementation, SQL, migrations, UI changes, or dashboard changes performed.

## 1. Confirmed Decisions

### Product ownership and catalog model

Confirmed:

- `provider_products` remains the initial provider-owned listing table.
- Every row belongs to exactly one Store or exactly one Manufacturer.
- Store and Manufacturer listings remain separate records and can have identical names/dosages.
- Store-owned source-manufacturer metadata remains separate from provider ownership.

### Pending orders and stock

Confirmed as intentional behavior:

- Checkout validates current availability and stock but creates no reservation.
- Creating a Pending order does not change stock.
- Pending orders do not reduce available quantity.
- Approval revalidates the complete order against current stock and provider/product availability.
- Approval fails atomically if the order cannot be fulfilled without partial stock deduction or partial approval.
- Concurrent approvals must serialize the affected stock rows so only one approval can consume stock.
- If stock is consumed by another approval first, the later approval fails and the order remains Pending for Admin handling unless a later explicit workflow decision is made outside this initial design.
- No stock reservation table, reservation status, or new order status is proposed.

### Rounding and pricing direction

Confirmed:

- Product consumer price is stored as `numeric(12,2)` EGP.
- Discount is stored as `numeric(5,2)` representing percentage points.
- Pharmacist price is calculated as:

```text
consumer_price × (1 - discount_percentage / 100)
```

- Currency precision is two decimal places.
- Order-item pharmacist price must be a stored snapshot.

### Historical order direction

Confirmed:

- `orders` and `order_items` remain the permanent historical representation.
- `order_items.product_id` may become nullable.
- Historical order display must rely primarily on snapshot fields rather than live joins.
- Product/provider soft deletion must not remove historical order information.

## 2. Issues Found

### Product normalization

The audit's generic generated normalized-name/dosage approach is sound, but the exact application semantics must be specified before database implementation.

The existing implementation currently defines normalization as:

- Name: trim, collapse redundant whitespace to one ASCII space, lowercase.
- Dosage: trim, collapse redundant whitespace, remove all whitespace, lowercase, and replace `milligram`/`milligrams` with `mg`, `gram`/`grams` with `g`, and `milliliter`/`milliliters` with `ml`.

A PostgreSQL-only case or unit rule must reproduce these semantics. The database and application must not use slightly different replacement or whitespace behavior.

Potential edge cases:

- `500 mg`, `500mg`, and `500 MG` should match under the existing application behavior.
- `1 gram`, `1 grams`, and `1g` should match.
- Unicode and mixed whitespace may behave differently in JavaScript and PostgreSQL if not explicitly normalized.
- Redundant whitespace inside names must collapse consistently.
- Missing dosage and an explicit empty dosage currently normalize to the same empty key.

### Soft-deleted product uniqueness

A regular global or non-partial provider unique index would prevent reuse after soft deletion. This is undesirable.

Uniqueness must apply only to active, non-soft-deleted listings. The exact index can differ by owner because PostgreSQL partial indexes are the cleanest way to account for Store and Manufacturer ownership.

### Pending approval concurrency

The earlier proposal is correct, but approval must use a transaction with row locks and repeat stock validation after acquiring locks.

A status check alone is insufficient:

- Two Admin actions could read the same stock simultaneously.
- Two orders could consume shared stock concurrently.
- A second approval must not pass merely because it validated before the first approval committed.

### RLS versus authentication

RLS can protect table access, but it cannot by itself guarantee every protected application operation is safe or that a session stops using the app as soon as an account status changes.

Additional server-side enforcement is necessary for:

- Login/session blocking for pending, rejected, or inactive pharmacists.
- Revalidating pharmacist status inside every protected RPC.
- Profile creation.
- Admin role verification.
- Stock and order workflow mutations.

Screen hiding, client route checks, and auth-session presence are not security controls.

### Historical provider/product references

The current proposal has two fields named `seller_id` and `seller_legacy_id`, which is sufficient conceptually but should be specified more clearly.

The order snapshot must distinguish:

- Current product reference.
- Permanent product snapshot.
- Permanent provider snapshot.
- Optional provider UUID snapshot.
- Optional provider legacy ID snapshot.

A provider's current row must not be joined into historical rendering when the snapshot is sufficient.

### Pricing precision

The proposed generated/stored pharmacist price field is not yet precise enough without an explicit rounding rule.

The existing JavaScript helper uses:

```text
Math.round((value + Number.EPSILON) * 100) / 100
```

This is close to decimal half-up behavior for positive EGP values, but floating-point implementation details should not be used as the database standard.

## 3. Recommended Final Changes to the Schema

### 3.1 Product normalization and uniqueness

Add to `provider_products`:

- `normalized_name` as a database-maintained deterministic field.
- `normalized_dosage` as a database-maintained deterministic field.
- Keep original `name` and `dosage` fields unchanged for display.

Recommended exact normalization:

- Trim leading and trailing whitespace.
- Collapse redundant whitespace to a single space for names.
- Lowercase consistently.
- For dosage, trim and collapse whitespace.
- Remove redundant internal whitespace.
- Lowercase.
- Normalize `milligram`/`milligrams` to `mg`.
- Normalize `gram`/`grams` to `g`.
- Normalize `milliliter`/`milliliters` to `ml`.

Do not introduce unrelated unit conversions or stemming. In particular, do not convert `500mg` to `0.5g` or silently infer dosage equivalence.

Recommended database uniqueness strategy:

- Partial unique index for Store-owned active listings:
  - Store owner is populated.
  - Manufacturer owner is null.
  - Soft-deleted timestamp is null.
  - Unique on `(store_id, normalized_name, normalized_dosage)`.

- Partial unique index for Manufacturer-owned active listings:
  - Manufacturer owner is populated.
  - Store owner is null.
  - Soft-deleted timestamp is null.
  - Unique on `(manufacturer_id, normalized_name, normalized_dosage)`.

- Deactivated but non-deleted listings should remain unique.
- Soft-deleted listings should not participate in uniqueness.
- Out-of-stock listings remain unique because they are still listings, not soft deletions.

If active uniqueness is not meant to include deactivated products, a second availability predicate would be required. However, the existing implementation currently prevents duplicate creation regardless of availability, so deactivated listings must remain in the unique set.

Limitations:

- PostgreSQL and JavaScript case/whitespace behavior must be tested for Unicode and mixed-language product names.
- Normalized values should be database-maintained or enforced by the same server function used for writes.
- UI duplicate checking remains advisory and not authoritative.

### 3.2 Provider-product field changes

Recommend changing `dosage` to nullable or retained nullable for migration compatibility, but enforce the application duplicate key as follows:

- Null dosage is normalized to an empty string.
- Existing new product submissions require a dosage because this is the current UI/business behavior.
- `normalized_dosage` is non-null and stored as a normalized empty string for null or empty values.

This preserves legacy rows without allowing missing dosage to bypass a duplicate key.

### 3.3 Pending stock behavior

No schema status or table change is necessary.

Approval RPC requirements should be amended to require:

- Transaction-level locking of the order.
- Transaction-level locking of every affected `provider_products` row.
- Re-validation after locks are acquired.
- Aggregation of repeated quantities by product listing.
- A complete success or complete failure result.
- No stock updates before all validation succeeds.
- Status and `stock_deducted` updates in the same transaction as stock deductions.

The approval RPC should return a structured failure for insufficient stock or provider/product invalidation. The order remains Pending.

No stock is reserved at order placement.

### 3.4 RLS and authentication changes

Recommended server mechanisms:

1. Database trigger on Supabase Auth user creation:
   - Creates the profile server-side.
   - Forces `role = pharmacist`.
   - Forces `account_status = pending`.
   - Ignores client role/status metadata.

2. RLS profile protection:
   - Users can read only their own profile.
   - Users cannot update `role`, `account_status`, `rejection_reason`, or profile decision fields.
   - Admins read/update profiles through protected operations or tightly scoped policies.

3. Protected-table RLS policies:
   - Require authenticated `auth.uid()`.
   - Require a matching active pharmacist profile for pharmacist operations.
   - Require a matching Admin profile with `role = admin` for Admin operations.

4. RPCs recheck authorization and status internally:
   - RLS does not replace authorization inside an RPC.
   - `create_order`, favorites, and Admin workflows must verify identity and status directly.

5. Session enforcement:
   - Use a Supabase Auth enforcement mechanism or server-side post-login check for pending/rejected/inactive status.
   - RLS remains a final database-level protection even if a stale application session exists.

6. Admin provisioning:
   - First Admin is provisioned outside public registration through a secure one-time process.
   - Initial Admin role assignment is performed server-side.
   - Public metadata, profile fields, and registration inputs cannot grant Admin role.

### 3.5 Historical order item snapshot fields

The following snapshot fields are recommended as mandatory for order rendering:

- `product_name`
- `dosage`
- `package_size`
- `variant`
- `seller_type`
- `seller_name`
- `seller_id`/provider UUID snapshot, nullable or text
- `seller_legacy_id`, nullable text
- `consumer_price`
- `discount_percentage`
- `pharmacist_unit_price`
- `quantity`
- `line_total`

The current-product reference should remain separate:

- `product_id` nullable
- Foreign-key deletion or provider removal must not mutate historical snapshot fields.
- Provider deletion should not cascade-delete order items.

Recommended `order_items.product_id` behavior:

- Soft deletion leaves the current reference or sets it null during explicit cleanup.
- Rely on snapshots for display.
- Do not join to `provider_products` for historical product name or price.

### 3.6 Pricing and rounding

Use PostgreSQL `numeric`/`decimal` arithmetic throughout the database and order snapshot calculations.

Recommended precision:

- Store consumer price and pharmacist unit price as `numeric(12,2)`.
- Store discount as `numeric(5,2)`.
- Store line total as `numeric(12,2)`.

Recommended rounding rule:

- Round positive EGP prices to two decimal places using decimal half-up/away-from-zero semantics.
- The database and application must use an identical two-decimal rule.

The product pharmacist price field should be stored, generated, or atomically validated from consumer price and discount. For this application, recommend stored/generated derived data for fast reads and explicit consistency checks. The exact database-generated value must be the source of truth for order snapshots.

At order creation:

- Capture `consumer_price` from the current provider listing.
- Capture `discount_percentage` from the current listing.
- Calculate/copy `pharmacist_unit_price` using the database-generated value or database-calculated equivalent.
- Round/copy at two decimals.
- Calculate `line_total = round(pharmacist_unit_price × quantity, 2)`.
- Sum line totals to calculate order `total_price`.
- Calculate `total_discount` by consumer subtotal minus pharmacist subtotal if needed by a report or UI; do not persist redundant `total_discount`.

The application must stop using JavaScript floating-point `Math.round` as the authority. It should obtain current prices and snapshots from server/RPC data or implement decimal-string/cent arithmetic matching the database.

## 4. Remaining Risks

1. Pending/rejected/inactive session enforcement needs an Auth mechanism or server-side check in addition to RLS.
2. Unicode and mixed-unit normalization differences require explicit test cases shared by database and application.
3. Concurrent order approval requires correct row-lock ordering and a complete atomic approval RPC.
4. Soft-deleted products with existing favorites need an explicit app filtering policy.
5. Provider soft deletion with active products must be handled consistently; active listings should not remain purchasable when their provider is inactive/deleted.
6. A stale app session can remain authenticated after account status changes; all protected RPC/RLS checks must revalidate status.
7. Supabase Auth profile creation trigger behavior must preserve profile uniqueness and email normalization.
8. `source_manufacturer_name` and `source_manufacturer_id` must never be interpreted as listing ownership.
9. If a provider is name-changed after an order, the order snapshot remains stable because order items store `seller_name`.
10. If a product is name/price changed after an order, `order_items.product_name` and prices remain stable.
11. If `order_items.product_id` is soft-deleted or set null, historical rendering must not depend on it.

## 5. Concise Schema Changes Compared with the Previous Proposal

1. Add explicit generated normalized name/dosage fields to `provider_products`.
2. Replace generic uniqueness planning with separate partial unique indexes for Store and Manufacturer owners.
3. Clarify that soft-deleted rows are excluded from uniqueness while deactivated/non-deleted rows remain in the duplicate set.
4. Clarify that missing dosage normalizes to an empty-string key while new app submissions remain dosage-required.
5. Keep stock without reservation and document Pending stock availability behavior explicitly.
6. Add row-lock and atomic revalidation requirements to `approve_order`.
7. Add server-side profile/Auth trigger and protected-RPC status checks beyond RLS.
8. Add explicit historical provider snapshot fields and clarify nullable current product foreign-key behavior.
9. Specify decimal `numeric` precision and half-up/two-decimal rounding.
10. Recommend a generated/stored pharmacist price field and database-valid authoritative values.
11. Clarify that order line totals and order totals are stored snapshots or calculated at order creation, while total discount remains calculated rather than persisted.

No new table is required by this review. No implementation has been performed.
