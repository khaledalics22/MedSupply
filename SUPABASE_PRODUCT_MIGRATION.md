# MedSupply Supabase Provider-Product Migration

## Status

Implemented the provider-product migration in application code. No Supabase migration or SQL was executed.

## Application changes

- Added typed async provider-product operations to the database abstraction and MockDatabase wrappers.
- Routed provider-product reads and writes through `ProviderAwareDatabase` to `SupabaseProviderDatabase`.
- Updated Store and Manufacturer product screens to load products asynchronously and toggle availability through Supabase.
- Updated the Add/Edit Product form to save through the unified async provider-product methods.
- Added normalized duplicate-name/dosage detection by provider, excluding the product being edited.
- Added provider-product listing, lookup, create, update, status, soft-delete, and duplicate lookup methods.
- Added explicit Supabase configuration guards using a local narrowed client in every provider-product method.
- Retained only one `mapProduct` mapper in `SupabaseProviderDatabase`.

## Provider-product SQL

Prepared migration:

- `supabase/migrations/202611240005_provider_product_policies.sql`

The migration contains admin CRUD policies and authenticated pharmacist active-product browse policies. It has not been applied.

## Validation

- VS Code diagnostics report no errors in:
  - `src/app/models/supabase_database.ts`
  - `src/app/models/database.ts`
  - `src/app/models/ioc_container.ts`
  - Product form layout
  - Store detail layout
  - Manufacturer detail layout
- A full `npx tsc --noEmit` run could not resolve the local Expo TypeScript base configuration because `expo/tsconfig.base` is unavailable to the compiler in the current dependency state.

## Still requiring live validation

After applying approved migrations and configuring valid Supabase environment variables:

1. Create a product as an admin Store provider.
2. Create a product as an admin Manufacturer provider.
3. Edit and toggle availability for both provider types.
4. Verify duplicate name/dosage rejection within the same provider.
5. Verify an identical product can exist for a different provider.
6. Verify active pharmacists can only see active, non-deleted, in-stock products from active providers.
7. Verify soft deletion removes the product from normal admin/pharmacist results.
