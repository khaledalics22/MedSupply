# Step 7 — Admin Order Actions Proposal

## Scope

This document proposes the minimum server-side and TypeScript changes required for:

- Immediate stock deduction when an order is submitted.
- Atomic order creation across `orders`, `order_provider_groups`, and `order_items`.
- Secure Admin approval, rejection, and completion operations.
- Status transitions without stock changes after submission.
- Permanent stock deduction for rejected orders.
- TypeScript abstraction and UI integration without adding direct UI-to-Supabase calls.

No files or SQL are changed and no database migrations are executed by this proposal.

## 1. Existing `create_order` behavior

The existing RPC is in:

- `supabase/migrations/202611260002_secure_order_creation.sql`

It currently:

- Requires an authenticated active pharmacist.
- Validates an array containing unique product IDs and positive quantities.
- Locks requested product rows with `FOR UPDATE`.
- Validates that products exist, are active, have valid pricing, and have sufficient stock.
- Locks and validates Store/Manufacturer rows.
- Calculates server-side snapshots and totals.
- Inserts `orders` with `status = pending`.
- Inserts provider groups and order items.
- Returns a JSON object containing the order ID and totals.

The relevant existing comment is:

```sql
-- Lock product rows in deterministic UUID order, without reserving stock or changing availability.
```

The product loop validates:

```sql
if v_product.stock_quantity < v_quantity then
```

It does not execute an update such as:

```sql
update public.provider_products
set stock_quantity = stock_quantity - v_quantity;
```

Therefore, the RPC only validates stock today. It does not reserve or deduct stock, and the same product inventory could be used by concurrent pending orders until manually changed.

## 2. Existing order status constraint

The existing order schema is in:

- `supabase/migrations/202611260001_orders_schema_rls.sql`

It currently requires:

```sql
(status in ('pending', 'rejected') and stock_deducted = false)
or
(status in ('approved', 'completed') and stock_deducted = true)
```

That conflicts with the requested business rule because rejected orders must retain permanently deducted stock.

The migration should replace this constraint with a rule that requires `stock_deducted = true` for all status values:

```sql
alter table public.orders
  drop constraint orders_stock_deducted_status_consistent;

alter table public.orders
  add constraint orders_stock_deducted_status_consistent
  check (stock_deducted = true);
```

The existing `create_order` values for `stock_deducted` must also become `true`.

Existing historical records should not be rewritten solely because constraints change. A migration should only set existing orders to `stock_deducted = true` if they are confirmed to have already paid/deducted stock under the new business process.

## 3. Minimum `create_order` changes

### 3.1 Lock product rows

Existing product lookup logic already executes:

```sql
for v_product in
  select p.*
  from public.provider_products p
  join pg_temp.requested_order_items r on r.product_id = p.id
  order by p.id
  for update of p
loop
```

This should remain. It is the main concurrency mechanism for concurrent order submissions.

### 3.2 Deduct after validation

Inside the existing product loop, after availability, stock, pricing, and provider ownership validation, execute a stock update:

```sql
update public.provider_products
set
  stock_quantity = stock_quantity - v_quantity,
  is_available = case
    when stock_quantity - v_quantity = 0 then false
    else is_available
  end
where id = v_product.id;
```

For every product in the request:

1. Read and lock the current product row.
2. Recheck `deleted_at`, `is_available`, and `stock_quantity`.
3. Compare stock with the requested quantity.
4. Deduct stock if valid.
5. Set `is_available = false` when stock reaches zero.
6. Continue to provider validation and order insertion.

Stock deduction should occur only after all required product rows are locked and validated.

### 3.3 Atomic rollback

The RPC is already an atomic PostgreSQL transaction. If the function raises an exception:

- Prior stock updates roll back.
- The pending order insert rolls back.
- Provider-group inserts roll back.
- Order-item inserts roll back.
- Temporary table changes disappear with the transaction.

If an exception occurs after one product is deducted but for a later product or provider minimum, PostgreSQL rolls back every deduction.

No partial stock deduction can remain from the RPC.

### 3.4 Concurrent submission behavior

For two pharmacists submitting simultaneously for the same product:

1. RPC A locks the product row.
2. RPC A validates stock and deducts it.
3. RPC A inserts order/provider/items and commits.
4. RPC B waits for the lock.
5. RPC B resumes and re-reads product stock after RPC A commits.
6. RPC B either deducts the remaining stock successfully or raises insufficient-stock and rolls back.

The deterministic product lock order prevents the existing product loop from introducing lock-order deadlocks across multi-product orders.

No in-memory stock state or application-side stock check is authoritative.

### 3.5 Ensure availability constraints remain valid

The provider-product table requires:

```sql
stock_quantity >= 0
```

and:

```sql
stock_quantity <> 0 OR is_available = false
```

The stock update must prevent negative stock. The update should execute only after the stock sufficiency check, and the is-available update must set zero-stock products unavailable.

## 4. Proposed Admin action RPCs

All action RPCs should:

- Be `SECURITY DEFINER`.
- Use `set search_path = ''`.
- Qualify database objects and built-in functions.
- Revoke execution from `public`, `anon`, and `authenticated`, then grant only to `authenticated`.
- Verify `auth.uid()` is not null.
- Verify `public.is_profile_admin()` inside the RPC.
- Lock the order row with `FOR UPDATE`.
- Recheck the current status after acquiring the lock.
- Never modify `provider_products` stock.

### 4.1 `approve_order(order_id uuid)`

Purpose:

- Transition an entire order from `pending` to `approved`.

Behavior:

1. Resolve `auth.uid()`.
2. Reject if no authenticated caller exists.
3. Reject unless `public.is_profile_admin()` is true.
4. Lock the matching row in `public.orders`.
5. Reject missing orders.
6. Reject all statuses except `pending`.
7. Update:

```sql
status = 'approved'
approved_at = pg_catalog.now()
stock_deducted = true
rejected_at = null
completed_at = null
rejection_reason = null
```

No provider product or order-item update is required.

Return JSON:

```json
{
  "order_id": "<uuid>",
  "status": "approved"
}
```

### 4.2 `reject_order(order_id uuid, rejection_reason text)`

Purpose:

- Transition an entire order from `pending` to `rejected`.

Behavior:

1. Validate Admin authorization.
2. Trim and validate the rejection reason.
3. Lock the matching order row.
4. Reject missing orders.
5. Reject all statuses except `pending`.
6. Update:

```sql
status = 'rejected'
rejection_reason = pg_catalog.btrim(rejection_reason)
rejected_at = pg_catalog.now()
stock_deducted = true
approved_at = null
completed_at = null
```

Do not restore or modify stock.

Rejected stock must remain deducted permanently.

Return JSON:

```json
{
  "order_id": "<uuid>",
  "status": "rejected"
}
```

### 4.3 `complete_order(order_id uuid)`

Purpose:

- Transition an entire order from `approved` to `completed`.

Behavior:

1. Validate Admin authorization.
2. Lock the matching order row.
3. Reject missing orders.
4. Reject all statuses except `approved`.
5. Update:

```sql
status = 'completed'
completed_at = pg_catalog.now()
stock_deducted = true
rejection_reason = null
```

Keep `approved_at` unchanged. Never update provider product stock.

Return JSON:

```json
{
  "order_id": "<uuid>",
  "status": "completed"
}
```

## 5. RPC error design

Recommended SQL state classes:

- `42501`: authentication or Admin authorization failure.
- `P0002`: order or profile not found.
- `P0001`: invalid status transition or rejection reason problem.
- `22023`: invalid input shape or missing required input.

Examples:

```sql
raise exception 'Authentication is required.' using errcode = '42501';
raise exception 'Only administrators can approve orders.' using errcode = '42501';
raise exception 'Order does not exist.' using errcode = 'P0002';
raise exception 'Only pending orders can be approved.' using errcode = 'P0001';
raise exception 'A rejection reason is required.' using errcode = '22023';
```

## 6. Locking and concurrency protection

### Order submission

Order submission should lock all relevant `provider_products` rows.

This is sufficient because:

- Product stock is updated under the row lock.
- The lock is held until the RPC transaction commits or rolls back.
- A concurrent submission rechecks the latest committed stock.
- Provider minimum and provider status checks also execute under provider locks.

### Admin actions

Admin actions should lock the order row:

```sql
select *
from public.orders
where id = order_id
for update;
```

Concurrent actions then serialize:

- Approve first: approve succeeds; reject or complete checks status and fails.
- Reject first: reject succeeds; approval/check fails.
- Complete first: completion succeeds after approval; a concurrent approval/rejection fails because the status is completed/approved.

The status check must occur after row locking, not before it.

### No stock locks for Admin actions

Admin actions should not lock or update `provider_products` because stock is already deducted at submission and rejected orders remain deducted.

## 7. Required SQL changes

At minimum, add or update migrations for:

1. Updating the `create_order` function:
   - Keep existing validation and locks.
   - Add stock deduction.
   - Set `is_available = false` at zero stock.
   - Set `stock_deducted = true` on the inserted order.

2. Updating `orders_stock_deducted_status_consistent`:
   - Require `stock_deducted = true` for all statuses.

3. Adding:
   - `approve_order(uuid)`.
   - `reject_order(uuid, text)`.
   - `complete_order(uuid)`.

4. Retaining existing order RLS policies.

5. Applying direct privilege restrictions:
   - Keep order-table direct writes revoked.
   - Revoke action RPC execution from public/anonymous roles.
   - Grant action RPC execution to authenticated users.

No additional schema table is required for basic concurrency protection.

## 8. Existing UI and state findings

The read-only Admin detail UI currently calls only `getOrderByIdAsync()` and contains no action RPC UI.

The current AppState implementation still contains local-only/legacy actions:

- `approveOrder()` deducts local stock.
- `rejectOrder()` only changes local state.
- `completeOrder()` only changes local state.

These must not remain the production source of truth after Step 7.

The admin list currently uses `getAllOrdersAsync()` and is Supabase-backed. The dashboard pending preview/count still reads local `AppState.orders`, so it should not be treated as a server-authoritative order summary until a separate fetch or refresh is added.

## 9. TypeScript and UI implementation sequence

### Step 9.1 — Add action result types

In `src/app/models/data_types.ts`, add types such as:

```ts
export interface OrderActionResult {
  orderId: string;
  status: 'approved' | 'rejected' | 'completed';
}
```

No existing order snapshot fields need to change for basic actions.

### Step 9.2 — Extend `Database`

In `src/app/models/database.ts`, add:

```ts
approveOrderAsync(orderId: string): Promise<OrderActionResult>;
rejectOrderAsync(orderId: string, reason: string): Promise<OrderActionResult>;
completeOrderAsync(orderId: string): Promise<OrderActionResult>;
```

Keep these isolated from stock-deduction methods.

`MockDatabase` implementations should remain test-only and should not use real or false Supabase order records.

### Step 9.3 — Implement Supabase RPC wrappers

In `src/app/models/supabase_database.ts`, add methods that:

- Call `client.rpc('approve_order', { order_id: orderId })`.
- Call `client.rpc('reject_order', { order_id: orderId, rejection_reason: reason })`.
- Call `client.rpc('complete_order', { order_id: orderId })`.
- Throw on RPC errors or missing data.
- Validate the returned order ID and status.

### Step 9.4 — Route through ProviderAwareDatabase

In `src/app/models/ioc_container.ts`, add the three async methods and route them to `supabaseProviderDatabase`.

No UI component should call `supabase.rpc()` directly.

### Step 9.5 — Replace AppState local actions

Update `src/app/state/app_state.tsx`:

- Make actions async.
- Remove `approveAndDeductOrderStock()` use.
- Remove local stock changes.
- Call the server RPC through `iocContainer.getDatabase()`.
- Refresh or update the matching local compatibility order only after RPC success.
- Preserve rejected stock and never restore stock.

Recommended action contract:

```ts
approveOrder: (orderId: string) => Promise<{ success: boolean; errors: string[] }>;
rejectOrder: (orderId: string, reason: string) => Promise<{ success: boolean; errors: string[] }>;
completeOrder: (orderId: string) => Promise<{ success: boolean; errors: string[] }>;
```

The boolean reject helper can be replaced by this result shape for consistent error reporting.

### Step 9.6 — Restore Admin detail actions

In `src/app/layouts/admin_order_detail_layout/index.tsx`:

- Pending: show Approve and Reject controls.
- Approved: show Complete control.
- Rejected/completed: show no action controls.
- Add confirmation dialogs.
- Disable controls during RPC submission.
- On success, call `getOrderByIdAsync(orderId)` again.
- Show server-returned status/timestamps.
- Keep provider grouping read-only and snapshot-based.

### Step 9.7 — Refresh Admin list and dashboard summaries

- The Admin Orders list can reload `getAllOrdersAsync()` after an action.
- The dashboard should ideally fetch server order summaries or receive a refresh signal instead of relying only on local compatibility state.
- The Admin detail and list should remain server-fetching rather than local-only.

## 10. Checkout response validation

The current `createOrderAsync()` should be tightened before or alongside this implementation.

It should validate:

- `data.order_id` is a valid UUID and non-empty.
- `data.status === 'pending'`.
- Numeric totals are finite and non-negative.
- `line_count > 0`.
- `total_quantity > 0`.

The AppState local order should be created only after `createOrderAsync()` returns a validated result.

This also ensures the UI cannot claim success for a malformed RPC response.

## 11. Testing sequence

Before implementation is considered complete, test:

1. Successful order submission deducts stock once.
2. Successful multi-provider order deducts every product once.
3. Failed minimum-order validation rolls back all stock deductions.
4. Failed provider or insertion validation rolls back all stock deductions.
5. Insufficient stock rejects one order with no partial deduction.
6. Two simultaneous submissions for the last available units allow only one success.
7. Rejection changes status and never restores stock.
8. Approval changes status only.
9. Completion changes status only.
10. Concurrent approve/reject on the same pending order produces only one status change.
11. Concurrent duplicate completion produces no additional stock or status changes.
12. Non-Admin RPC calls are rejected.
13. No direct authenticated client writes to order tables or order stock RPC bypasses.

## 12. Implementation recommendation

Implement in this order:

1. Add a migration updating `create_order` stock deduction and `stock_deducted` semantics.
2. Add approval, rejection, and completion RPC migrations.
3. Add RPC TypeScript wrappers and abstraction methods.
4. Replace legacy local AppState action behavior.
5. Restore Admin detail action controls.
6. Add list/detail refresh behavior.
7. Add validation/concurrency tests.

Implementation should wait for approval because SQL, stock behavior, privileges, and status constraints are permanent production changes.
