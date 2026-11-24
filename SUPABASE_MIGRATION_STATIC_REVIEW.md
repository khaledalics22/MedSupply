# MedSupply Initial Migration Static Review

**File reviewed:** `supabase/migrations/202611240001_initial_medsupply_foundation.sql`

**Status:** No SQL executed and no file modified.

## Overall Verdict

**PASS — conditional**

The migration is syntactically structured for PostgreSQL/Supabase and no conflicting or out-of-scope objects are present. It should be safe for execution in a clean target project with no existing application objects, subject to the two static concerns below.

## Critical Issues

No critical schema-breaking issues found.

One data-integrity concern is present:

- `profiles.email` is `extensions.citext UNIQUE` but not explicitly `NOT NULL`. PostgreSQL permits multiple NULL email values in a UNIQUE column. The existing `profiles_email_required` check does not reject NULL because `btrim(NULL)` returns NULL and the CHECK expression passes.

This was not changed because this review is read-only. If pharmacist/Admin profile email is required, add `NOT NULL` to the migration before execution.

## Non-Critical Recommendations

- Standardize whether `citext` should be installed in `extensions`; the schema and column qualification match that approach.
- The `profiles_role_status_consistent` constraint assumes every pharmacist has a status and every Admin has no status. This matches the approved model.
- `stores.deleted_at` and `manufacturers.deleted_at` require inactive status; this is consistent with the proposed soft-deletion behavior.
- `provider_products.deleted_at` requires unavailable status.
- Partial uniqueness correctly excludes soft-deleted rows while retaining deactivated and out-of-stock rows.
- The `provider_products_source_manufacturer_id` foreign key uses `RESTRICT`, so source manufacturers cannot be hard-deleted while referenced. This is conservative and appropriate for historical metadata.

## Static Findings

### PostgreSQL syntax

- Valid `CREATE EXTENSION`, enum, function, table, index, trigger, and transaction syntax.
- `auth.users` is a valid Supabase foreign-key target.
- `gen_random_uuid()` is used without an extension declaration.
- Generated columns are immutable/dependent on immutable SQL functions and numeric expressions.

### Extension handling

- Citext installation is explicitly scoped to `extensions`.
- `profiles.email` explicitly uses `extensions.citext`.
- No `pgcrypto` declaration is present.
- Existing pgcrypto installation is not modified or uninstalled.

### Tables and relationships

- Six intended foundational tables are present.
- No orders, favorites, cart, notification, advertisement, pharmacy, RLS policy, Auth trigger, or RPC object is present.
- Profile decisions use a restricted relationship to profiles.
- Provider products reference exactly one supported owner through a XOR-style CHECK constraint.

### Normalization

- Name normalization lowercases, trims, and collapses POSIX whitespace.
- Dosage normalization lowercases before unit replacement, removes whitespace, and preserves the original display value.
- Unit replacement matches the approved milligram, gram, and milliliter rules.
- NULL dosage normalizes to an empty string.

### Uniqueness

- Store uniqueness: `(store_id, normalized_name, normalized_dosage)`.
- Manufacturer uniqueness: `(manufacturer_id, normalized_name, normalized_dosage)`.
- Both indexes exclude rows with `deleted_at IS NOT NULL`.
- Deactivated and out-of-stock rows remain protected by uniqueness.

### Triggers and dependencies

- Normalization and updated-at functions are created before tables/triggers.
- Tables are created before indexes and triggers.
- Updated-at triggers run only on UPDATE.
- RLS is enabled after table creation and before no-policy commit.

### RLS

RLS is enabled on:

- `profiles`
- `account_decisions`
- `specialties`
- `stores`
- `manufacturers`
- `provider_products`

No RLS policies are created.

## Safe Execution Confirmation

Assuming a clean target project and no conflicting object names, the migration can be treated as safe to execute for initial foundational schema setup, with the email `NOT NULL` concern noted for approval if email is mandatory.

No SQL was executed and no migration file was modified during this review.
