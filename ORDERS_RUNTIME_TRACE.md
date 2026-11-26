# Admin Orders Runtime Trace

## Conclusion

A newly submitted order appearing pending in the Admin UI while the Supabase `orders`, `order_provider_groups`, and `order_items` tables remain empty is most likely caused by either:

1. The order only existing in in-memory compatibility state; or
2. The `create_order` RPC failing because the order migrations have not been applied or the app is connected to a different Supabase project.

The application has two different sources for Admin order data:

- The Admin dashboard uses local in-memory `AppState.orders` and does **not** query Supabase.
- The Admin Orders management screen uses `getAllOrdersAsync()` and does query Supabase.

The order migration files state that they are prepared for review and must not be executed until approved. No evidence was found in the application flow that they have been applied.

## 1. Checkout confirmation handler

File: `src/app/layouts/checkout_layout/index.tsx`

The `handleReview()` function:

- Prevents submission while cart mutations or submission are pending.
- Calls `refreshCartPricing()`.
- Opens the confirmation modal only when no cart-change issues exist.

The `handleConfirm()` function:

- Calls `createOrder()` from `useAppState()`.
- If `result.success` is true, sets:
  - `orderConfirmed = true`
  - `createdOrderId = result.orderId ?? null`
  - `confirmVisible = false`
- If `result.success` is false, displays returned checkout issues.
- If `createOrder()` throws unexpectedly, displays a generic cart-unavailable issue.

The checkout UI does not call Supabase directly. It calls `createOrder()` in app state.

## 2. `app_state.tsx` `createOrder()`

File: `src/app/state/app_state.tsx`, function `createOrder`, approximately lines 194–245

The runtime flow is:

1. Reject submission when the current cart is empty.
2. Call:

```ts
iocContainer.getDatabase().createOrderAsync(
  cartRef.current.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
  }))
)
```

3. If `createOrderAsync()` resolves successfully:
   - Construct a local `Order` object.
   - Set its status to `pending`.
   - Set `createdAt` to the current app time.
   - Add the order to `setOrders(previous => [order, ...previous])`.
   - Clear the cart with `commitCart([])`.
   - Return `success: true` and the returned RPC order ID.
4. If `createOrderAsync()` throws:
   - Convert the error into `success: false` plus a checkout issue.
   - Do not add the local order.
   - Do not clear the cart.

The local order is therefore **only added after a successful resolved result from `createOrderAsync()`**.

There is no persistence of `AppState.orders` to AsyncStorage or a database. It is a React state array:

```ts
const [orders, setOrders] = useState<Order[]>([]);
```

It can survive role navigation or logout/login within the mounted app process, but is recreated for a fresh app process.

## 3. `database.createOrderAsync()`

File: `src/app/models/database.ts`

The abstract `Database` method is:

```ts
createOrderAsync(items: OrderCreationItem[]): Promise<OrderCreationResult>
```

The mock implementation in `MockDatabase` is intentionally unusable:

```ts
throw new Error('Mock order creation is unavailable. Use Supabase create_order in production.');
```

It does not silently create a mock order.

## 4. `ProviderAwareDatabase.createOrderAsync()`

File: `src/app/models/ioc_container.ts`, method `createOrderAsync`

The production routing is:

```ts
createOrderAsync(items: any[]) {
  return this.supabaseProviders.createOrderAsync(items);
}
```

It routes directly to `SupabaseProviderDatabase.createOrderAsync()`.

There is no fallback to `MockDatabase.createOrderAsync()` in this path.

## 5. `SupabaseProviderDatabase.createOrderAsync()`

File: `src/app/models/supabase_database.ts`, approximately lines 425–440

This function:

1. Requires a configured Supabase client.
2. Converts cart items to:

```ts
{
  product_id: item.productId,
  quantity: item.quantity,
}
```

3. Calls:

```ts
client.rpc('create_order', {
  order_items_input: payload,
})
```

Therefore, checkout does invoke the Supabase `create_order` RPC when the application reaches this function.

### RPC response handling

The function behaves as follows:

- `error` is present: throw an error containing the Supabase code and message.
- `data` is null or missing: throw:

> “Supabase did not return an order creation result.”

- Valid `data` is converted into:
  - `orderId = data.order_id`
  - `totalQuantity = data.total_quantity`
  - `lineCount = data.line_count`
  - `subtotalAmount = data.subtotal_amount`
  - `discountAmount = data.discount_amount`
  - `totalAmount = data.total_amount`
  - `status = 'pending'`

No RPC response is silently ignored.

## 6. The `create_order` RPC

File: `supabase/migrations/202611260002_secure_order_creation.sql`

The RPC:

- Requires `auth.uid()`.
- Requires an active pharmacist profile.
- Validates the JSON array and item shape.
- Rejects duplicate product IDs.
- Locks and validates product rows.
- Validates stock.
- Validates provider ownership and provider status.
- Validates provider minimum order values.
- Calculates server-side pricing and totals.
- Inserts a row into `public.orders`.
- Inserts provider rows into `public.order_provider_groups`.
- Inserts product rows into `public.order_items`.
- Returns JSON containing `order_id`, quantities, totals, and `status: pending`.

The order, provider-group, and item inserts occur in the same transaction. If the RPC returns success, the database inserts should be visible unless the app connected to a different Supabase project or a later database operation removed them.

The migration also grants authenticated users permission to execute `create_order` and only SELECT access to the order tables.

## 7. The returned order ID

The RPC order ID is retained through this chain:

1. Supabase RPC returns `data.order_id`.
2. `SupabaseProviderDatabase.createOrderAsync()` converts it to `OrderCreationResult.orderId`.
3. `AppState.createOrder()` uses it to create the local `Order.id`.
4. `AppState.createOrder()` returns `{ success: true, orderId: result.orderId }`.
5. `CheckoutLayout.handleConfirm()` stores it in `createdOrderId`.
6. The checkout screen displays:

> “Order ID: {createdOrderId}”

Therefore, if the RPC call returned valid data, the returned order ID should remain visible in the checkout confirmation state.

## 8. Admin dashboard behavior

File: `src/app/layouts/admin_layout/index.tsx`

The Admin dashboard obtains orders through:

```ts
const { orders } = useAppState();
```

It then derives:

- Pending order count.
- Approved order count.
- Rejected order count.
- Completed order count.
- Pending order preview.

This dashboard:

- Does not call `getAllOrdersAsync()`.
- Does not query `orders` in Supabase.
- Does not merge persisted order records.
- Uses local `AppState.orders` only.

This is the exact UI that can show a pending order even though the Supabase order tables are empty.

## 9. Admin Orders management behavior

File: `src/app/layouts/admin_orders_layout/index.tsx`

When mounted, the screen calls:

```ts
iocContainer.getDatabase().getAllOrdersAsync()
```

The call is routed through:

- `ProviderAwareDatabase.getAllOrdersAsync()` in `src/app/models/ioc_container.ts`
- `SupabaseProviderDatabase.getAllOrdersAsync()` in `src/app/models/supabase_database.ts`

`getAllOrdersAsync()`:

- Queries `public.orders`.
- Selects nested `order_provider_groups` and `order_items`.
- Joins the pharmacist profile.
- Orders by `created_at` descending.
- Throws if Supabase configuration or the query fails.
- Maps returned rows into `Order[]`.

The returned array replaces only the Admin Orders screen’s React `orders` state:

```ts
.then((items) => setOrders(items))
```

It does not use `AppState.orders` and does not merge local compatibility state.

## 10. Admin Order Detail behavior

File: `src/app/layouts/admin_order_detail_layout/index.tsx`

The detail screen calls:

```ts
iocContainer.getDatabase().getOrderByIdAsync(orderId)
```

That is routed to `SupabaseProviderDatabase.getOrderByIdAsync()` and queries the selected order with nested provider groups and order items.

It does not read `AppState.orders`.

## 11. Silent fallback and error suppression

There is no silent fallback to mock or local order data in the production order creation path.

There are, however, error handling behaviors that can hide the exact Supabase error:

- `AppState.createOrder()` catches exceptions and returns `success: false`.
- `CheckoutLayout.handleConfirm()` converts that failure into checkout issues.
- The checkout issue renderer does not show the detailed RPC error text in most cases.
- `SupabaseProviderDatabase` throws on missing Supabase configuration, RPC errors, and missing RPC response data.
- `AdminOrdersLayout` catches fetch errors and displays an error/retry state.
- `MockDatabase` order creation throws instead of returning a mock order.

## 12. Migration and RLS considerations

The order table migration is:

- `supabase/migrations/202611260001_orders_schema_rls.sql`

The secure RPC migration is:

- `supabase/migrations/202611260002_secure_order_creation.sql`

Both migrations are marked as prepared for review only. They were not identified as applied by the runtime code because the application code contains no migration execution mechanism.

The order tables have RLS policies allowing:

- Active pharmacists to read their own orders.
- Admin profiles to read all orders.

The RPC is granted to authenticated users and revokes direct table-write access.

An RLS `SELECT` issue would affect reads, but generally would not explain why the RPC itself could not insert a pending order. It could explain why an Admin fetch returns empty if the admin profile helper or admin role is misconfigured.

## 13. Determination of each requested question

### Does checkout actually invoke the Supabase RPC?

Yes. The runtime path is:

```text
Checkout.handleConfirm()
  -> AppState.createOrder()
  -> Database.createOrderAsync()
  -> ProviderAwareDatabase.createOrderAsync()
  -> SupabaseProviderDatabase.createOrderAsync()
  -> supabase.rpc('create_order', ...)
```

### Is the RPC response successful?

It cannot be proven from source alone. A successful checkout requires `createOrderAsync()` to resolve and return `data` without `error`.

The strongest source-level suspicion is failure because:

- The migration is marked for review only.
- The RPC may not exist in the deployed project.
- The app may be connected to the wrong Supabase project.

### Is the returned order ID retained?

If `create_order` succeeds, yes:

- It is returned as `orderId` through `createOrderAsync()`.
- It is added to local `Order.id`.
- It is returned to checkout.
- It is retained in `createdOrderId` and displayed.

### Does the app add an order to local state independently of backend success?

No. Local state is only updated after `createOrderAsync()` resolves successfully.

However, once the RPC succeeds and returns, the app updates both backend and local compatibility state. This should not happen on an RPC exception.

### Does the Admin list display local orders instead of fetching Supabase?

It depends on which UI is involved:

- **Admin dashboard:** Yes, it displays local `AppState.orders` and is not Supabase-backed.
- **Admin Manage Orders screen:** No, it calls `getAllOrdersAsync()` and fetches Supabase.
- **Admin Order Detail:** No, it calls `getOrderByIdAsync()` and fetches Supabase.

### Is there a silent fallback or error suppression?

No silent fallback exists.

RPC exceptions are caught in `AppState.createOrder()` and transformed into a generic checkout failure, so the exact Supabase error may be suppressed from the confirmation UI.

## RPC response diagnosis

### Expected and actual response contract

The SQL function `public.create_order(jsonb)` returns:

```json
{
  "order_id": "<uuid>",
  "total_quantity": 1,
  "line_count": 1,
  "subtotal_amount": 100.00,
  "discount_amount": 10.00,
  "total_amount": 90.00,
  "status": "pending"
}
```

The SQL uses `pg_catalog.jsonb_build_object()`, and `v_order_id` is assigned from:

```sql
insert into public.orders (...)
values (...)
returning id into v_order_id;
```

The UUID is therefore expected to arrive as a JSON string in `data.order_id`.

`SupabaseProviderDatabase.createOrderAsync()` destructures the Supabase response as:

```ts
const { data, error } = await client.rpc(
  'create_order',
  { order_items_input: payload }
);
```

It expects `data` to be a non-null object with these fields:

- `order_id`
- `total_quantity`
- `line_count`
- `subtotal_amount`
- `discount_amount`
- `total_amount`

For a normal PostgREST RPC returning JSONB, `data` is expected to be the object itself, not an array and not `{ result: ... }`.

The exact runtime shape is not available from source review alone. Temporary non-sensitive logging was added before response validation to capture:

- Whether `error` exists.
- Supabase error code and message.
- Whether `data` is null.
- Whether `data` is an object or array.
- Top-level `data` keys.
- `data.order_id`.

No credentials or tokens are logged.

### Response validation weakness

The client checks only:

```ts
if (!data) throw ...
```

It does not validate:

- `data.order_id` exists.
- `data.order_id` is a non-empty string or valid UUID.
- Numeric fields are present and finite.
- `data.status` is `pending`.

The mapping then uses:

```ts
orderId: String(data.order_id)
```

This has incorrect success behavior for malformed successful responses:

- Missing `order_id` becomes the literal string `"undefined"`.
- Missing numeric values become `NaN` through `Number(...)`.
- An object with missing fields can still return a truthy `data` and continue to the local-order branch.
- An array can be truthy, but `data.order_id` is absent, producing the same `"undefined"` ID behavior.
- `data.order_id === null` becomes the literal string `"null"`.

No exception is thrown in these cases because `String(...)` and `Number(...)` do not throw for missing values.

Therefore, the app can incorrectly report success and add a pending local order if Supabase returns an RPC `data` object without a valid order ID.

### RPC success without an order insert

For the exact SQL function in `202611260002_secure_order_creation.sql`, a successful return is associated with an order insert:

1. The order is inserted and `returning id into v_order_id`.
2. Provider groups are inserted using that order ID.
3. Order items are inserted using that order ID.
4. Only after those inserts does the function execute `return pg_catalog.jsonb_build_object(...)`.

PostgreSQL function execution participates in the RPC transaction. Any exception during validation or one of the later inserts should roll back the order and group/item inserts.

There is no return statement on a separate success path that omits an order insert. Under this exact deployed function, a successful RPC response with a valid `order_id` is not expected to be possible while all three inserts are absent.

The migration must, of course, actually be deployed. If the wrong/old function is deployed, or a different RPC implementation responds successfully, the deployed implementation—not this migration file—would determine runtime behavior.

### Ordering of AppState validation and local-state insertion

`AppState.createOrder()` performs:

1. Cart emptiness validation.
2. Await `iocContainer.getDatabase().createOrderAsync(...)`.
3. Construct a local `Order`.
4. Call `setOrders(...)`.
5. Clear the cart.
6. Return success.

It does not add the local order in advance of the RPC result.

It also does not independently validate `result.orderId` or numeric fields after `createOrderAsync()` resolves. Its only validation is the absence of a thrown exception.

Consequently:

- RPC error: `createOrderAsync()` throws, `AppState.createOrder()` catches, local order is not added, cart is not cleared.
- RPC success with valid data: local order is added and cart cleared.
- RPC success with missing/invalid `order_id`: `createOrderAsync()` currently still resolves, so local order is added with an invalid ID and cart is cleared.
- RPC success with malformed numeric fields: local order is added with `NaN` quantities/totals.

### Temporary diagnostic location

Temporary logging was added in:

- `src/app/models/supabase_database.ts`
- Inside `createOrderAsync()` immediately after `client.rpc()` returns.

The log is identified by:

```text
[MedSupply create_order] RPC response
```

It does not print full RPC data, only the data type, top-level key names, error fields, and returned order ID.

### Smallest next diagnostic step

Submit one order from a known active account and inspect the single `[MedSupply create_order] RPC response` console entry.

The decisive observations are:

- `hasError: false` plus `hasData: true` and a valid UUID `returnedOrderId` means the RPC response itself is successful and shaped correctly.
- `hasError: true` means the RPC rejected or failed before success.
- `hasData: false` means no result was returned.
- `dataType: "array"` or unexpected `dataKeys` means the response shape differs from the SQL JSONB contract.
- `returnedOrderId: undefined`, `null`, `"undefined"`, or `"null"` means the mapping can falsely report success.

After the response result is known, the smallest verification is to check the same `returnedOrderId` as a read-only lookup in `public.orders`. No schema or data changes are needed.

## Most likely root cause

The most likely root cause is one of:

1. The order migration/RPC has not been deployed, causing the RPC call to fail.
2. The app is configured for a different Supabase project than the project where the migration and/or orders are being inspected.
3. The user is observing the Admin dashboard, whose pending count is entirely backed by local `AppState.orders`, rather than the Supabase-backed Manage Orders screen.

The RPC does not have a silent mock/local fallback, so an RPC failure should prevent the local order from being added. Consequently, the specific symptom of “order appears pending in the Admin dashboard but not in Supabase” can involve stale/in-process local state or a separate UI observation rather than successful backend creation.
