# MedSupply Provider Edit Fix

## Root cause

The edit forms were receiving provider models looked up synchronously from `MockDatabase` in `AdminApp`, instead of being loaded from Supabase by the provider ID.

The form components initialized controlled state directly from the passed model. In Supabase edit navigation, no matching MockDatabase provider existed, so the model was undefined and every field initialized empty.

## Files changed

- `src/app/index.tsx`
  - Store and Manufacturer form branches now pass `storeId` or `factoryId`.
  - Save callbacks refresh provider lists.

- `src/app/layouts/store_form_layout/index.tsx`
  - Accepts `storeId`.
  - Loads the Store asynchronously through `getStoreByIdAsync`.
  - Initializes all controlled fields after load.
  - Shows loading/error states.

- `src/app/layouts/manufacturer_form_layout/index.tsx`
  - Accepts `factoryId`.
  - Loads the Manufacturer asynchronously through `getFactoryByIdAsync`.
  - Initializes all controlled fields after load.
  - Shows loading/error states.

- `src/app/layouts/store_management_layout/index.tsx`
  - Refetches through `getStoresAsync` when refreshToken changes.

- `src/app/layouts/manufacturer_management_layout/index.tsx`
  - Refetches through `getFactoriesAsync` when refreshToken changes.

- `src/app/models/ioc_container.ts`
  - `ProviderAwareDatabase` routes provider operations to Supabase provider service.
  - Unrelated operations remain delegated to MockDatabase.

- `src/app/models/database.ts`
  - Added async provider operations to the existing Database abstraction.
  - Added MockDatabase async wrappers.

- `src/app/models/supabase_database.ts`
  - Supabase provider create/update/status/list/detail operations.
  - Database-to-model mapping remains centralized.

## Execution flow

### Store edit

1. Admin selects a Store and chooses Edit.
2. `AdminApp` passes `editingStoreId` to `StoreFormLayout`.
3. The form calls `getStoreByIdAsync(storeId)`.
4. Supabase fetches `public.stores` by ID.
5. Returned columns are mapped to `Store`.
6. Name, contact person, phone, address, description, image, and status initialize controlled form state.

### Manufacturer edit

1. Admin selects a Manufacturer and chooses Edit.
2. `AdminApp` passes `editingFactoryId` to `ManufacturerFormLayout`.
3. The form calls `getFactoryByIdAsync(factoryId)`.
4. Supabase fetches `public.manufacturers` by ID.
5. Returned columns are mapped to `Factory`.
6. Name, contact person, phone, address/location, description, image, and status initialize controlled form state.

### Save

- Edit mode retains the existing provider ID.
- Calls `updateStoreAsync` or `updateFactoryAsync`.
- No insert occurs during edit.
- Success requires a returned Supabase row.
- Save callback increments the management refresh token.

## Validation status

- TypeScript diagnostics pass for the changed edit forms, index, IoC, database, and provider service files.
- Live Supabase restart/edit persistence could not be executed in this environment.
- MockDatabase async provider operations remain functional.
