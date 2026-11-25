# MedSupply Supabase Stores and Manufacturers Implementation

## Files changed

- `src/app/models/supabase_database.ts`
  - Supabase CRUD/list/detail/status operations for stores and manufacturers.
  - Maps existing Supabase columns to current `Store` and `Factory` models.

- `src/app/models/ioc_container.ts`
  - Exposes the provider data service through the existing IoC container.
  - Preserves `MockDatabase` as the existing application database.

- `src/app/layouts/store_management_layout/index.tsx`
  - Loads all non-deleted stores asynchronously.
  - Preserves search and loading/error behavior.

- `src/app/layouts/manufacturer_management_layout/index.tsx`
  - Loads all non-deleted manufacturers asynchronously.
  - Preserves search and loading/error behavior.

- `src/app/layouts/store_form_layout/index.tsx`
  - Creates/updates stores through the provider service.
  - Adds duplicate-submit protection and error feedback.

- `src/app/layouts/manufacturer_form_layout/index.tsx`
  - Creates/updates manufacturers through the provider service.
  - Adds duplicate-submit protection and error feedback.

- `src/app/layouts/admin_store_detail_layout/index.tsx`
  - Loads and activates/deactivates a store through Supabase.
  - Preserves existing product view behavior.

- `src/app/layouts/admin_manufacturer_detail_layout/index.tsx`
  - Loads and activates/deactivates a manufacturer through Supabase.
  - Preserves existing product view behavior.

- `supabase/migrations/202611240004_provider_management_policies.sql`
  - Adds Admin insert/update/select policies for stores and manufacturers.

## Database operations implemented

- Fetch all stores.
- Fetch active stores for pharmacist-facing browsing.
- Fetch store by ID.
- Create store.
- Update store.
- Activate/deactivate store.
- Fetch all manufacturers.
- Fetch active manufacturers for pharmacist-facing browsing.
- Fetch manufacturer by ID.
- Create manufacturer.
- Update manufacturer.
- Activate/deactivate manufacturer.

## Field mappings

### Store

- `name` → `name`
- `contactPerson` → `contact_person`
- `phone` → `phone`
- `address` → `address`
- `description` → `description`
- `image` → `image_url`
- `status` → `status`
- `openHours` remains derived/defaulted until explicitly stored.
- `rating` remains defaulted when no database value exists.

### Manufacturer

- `name` → `name`
- `contactPerson` → `contact_person`
- `phone` → `phone`
- `address/location` → `address` and `location`
- `description` → `description`
- `image` → `image_url`
- `status` → `status`
- Certification and production capacity use existing schema/default values.

## RLS migration

Add `202611240004_provider_management_policies.sql` through Supabase SQL Editor.

The migration provides:

- Admin-only Store insert/update policies.
- Admin-only Manufacturer insert/update policies.
- Admin-only select-all policies for management screens.
- Existing active Store/Manufacturer browse policies remain pharmacist-facing and hide inactive/deleted providers.

## Security

- Admin authorization uses `public.is_profile_admin()` and the database profile.
- No service-role key is used in the application.
- Direct pharmacist writes are denied by the absence of pharmacist insert/update policies.
- Admin UI actions remain backed by RLS rather than hidden-only controls.

## Validation status

- Provider model and service files have no VS Code diagnostics.
- Store/Manufacturer management/form/detail UI files have no VS Code diagnostics.
- MockDatabase remains active in `IoCContainer`.
- The Supabase provider service is not used as a replacement for the MockDatabase abstraction.

## Manual steps

1. Execute `202611240004_provider_management_policies.sql` in Supabase SQL Editor.
2. Ensure the existing active Store/Manufacturer browse policies are present.
3. Ensure the Admin profile has `role = admin` and nullable `account_status`.
4. Test create/edit/status operations with an Admin session.
5. Verify a Pharmacist session cannot insert/update providers.
6. Verify inactive/deleted providers are excluded from active discovery queries.

## Limitation

Provider product operations remain on MockDatabase until their own Supabase migration is implemented. This task migrates providers only.
