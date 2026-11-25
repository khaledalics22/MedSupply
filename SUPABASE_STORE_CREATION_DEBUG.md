# Store Creation Supabase Debug Report

## Root cause

The observed Store success was initially caused by architecture drift:

- Store create/list screens depended on separate runtime paths.
- `MockDatabase` remained active in `IoCContainer`.
- Provider UI used separate async provider helpers rather than the existing `Database` abstraction.
- The UI could report success after a synchronous mock method or without verifying a returned Supabase row.

The Store form now uses `Database.addStoreAsync` and `Database.updateStoreAsync`. The management list uses `Database.getStoresAsync(true)`, and detail/status operations use `getStoreByIdAsync` and `setStoreStatusAsync`.

## Actual execution path after fix

### Create

1. `StoreFormLayout.save()` validates and awaits `iocContainer.getDatabase().addStoreAsync(input)`.
2. `ProviderAwareDatabase.addStoreAsync()` delegates to `supabaseProviderDatabase.addStore(input)`.
3. `SupabaseProviderDatabase.addStore()` inserts into `public.stores` and requests a returned row with `.select('*').single()`.
4. Supabase errors are propagated with code/message.
5. Missing returned data raises an explicit error.
6. Success is displayed only after the insert returns a row.
7. Admin callback increments `storeListRefresh`, remount/refetch navigation returns to the store list, and the list fetches `public.stores` again.

### List

- `StoreManagementLayout` calls `iocContainer.getDatabase().getStoresAsync(true)`.
- `ProviderAwareDatabase` delegates to `supabaseProviderDatabase.getStores(true)`.
- `SupabaseProviderDatabase` queries `public.stores` with `deleted_at IS NULL` and returns mapped rows.

## Files changed

- `src/app/models/database.ts`
  - Added async Store/Manufacturer provider operations to the existing abstraction.
  - Added MockDatabase async wrappers to preserve Mock fallback.

- `src/app/models/ioc_container.ts`
  - Added `ProviderAwareDatabase`.
  - Provider async operations delegate to Supabase provider service.
  - Unrelated operations continue to delegate to MockDatabase.

- `src/app/models/supabase_database.ts`
  - Real Supabase insert/select/update/status operations for Stores and Manufacturers.
  - Supabase errors include code and message.
  - Write operations verify returned rows.

- `src/app/layouts/store_form_layout/index.tsx`
  - Uses async Store create/update.
  - Awaiting, duplicate-submit guard, and error feedback preserve UI behavior.

- `src/app/layouts/store_management_layout/index.tsx`
  - Fetches Stores through the unified async Database method.
  - Refetches on `refreshToken` after successful save.

- `src/app/layouts/admin_store_detail_layout/index.tsx`
  - Fetches and updates Store status through unified async provider methods.

- `src/app/index.tsx`
  - Added Store list refresh epoch and successful-save callback refresh.

## RLS

No migration was modified or executed.

Required existing policy behavior:

- Authenticated Admin can `INSERT` and `UPDATE` stores through `public.is_profile_admin()`.
- Pharmacists can read active, non-deleted stores only.
- Pharmacists cannot insert/update stores.

The migration `202611240004_provider_management_policies.sql` contains the provider policy changes and should be executed only after review.

## Validation limitations

This environment could not execute or inspect a live Supabase database. Live validation requires:

1. Execute the provider RLS migration.
2. Create a Store from an authenticated Admin session.
3. Confirm the inserted UUID and fields in `public.stores`.
4. Confirm the management list refetches it.
5. Restart the app and confirm it remains visible.
6. Simulate RLS/network/constraint failure and confirm UI shows an error instead of success.
