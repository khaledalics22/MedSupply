# MedSupply Initial Supabase Migration Review

**Status:** Migration prepared for review. SQL has not been executed and no Supabase resources were changed.

## Migration file

`supabase/migrations/202611240001_initial_medsupply_foundation.sql`

## Scope created

### PostgreSQL enums

- `user_role`: `admin`, `pharmacist`
- `pharmacist_account_status`: `pending`, `active`, `rejected`, `inactive`
- `account_decision_status`: `approved`, `rejected`, `inactive`, `reactivated`
- `provider_status`: `active`, `inactive`

### Tables

- `profiles`
- `account_decisions`
- `specialties`
- `stores`
- `manufacturers`
- `provider_products`

### Indexes

- Account decisions: profile and decision time
- Store active listing uniqueness
- Manufacturer active listing uniqueness
- Store, manufacturer, specialty, and stock lookup indexes

### Important constraints

- Profile foreign key to `auth.users(id)` with cascade delete
- Profile role/account-status consistency
- Rejected profile requires a rejection reason
- Legacy and email uniqueness
- Store/manufacturer deleted providers must be inactive
- Exactly one provider owner per product
- Positive consumer price
- Discount between 0 and 100
- Non-negative stock
- Zero stock requires unavailable status
- Soft-deleted products require unavailable status
- Soft-deleted provider products participate only in partial lookup indexes, not product uniqueness

## Product normalization

The migration creates immutable SQL functions matching the application's existing semantics:

### Name

- Trim leading and trailing whitespace.
- Replace one or more POSIX whitespace characters with an ASCII space.
- Convert to lowercase.

The original `name` remains unchanged.

### Dosage

- Convert null to an empty string.
- Trim whitespace.
- Remove all whitespace characters.
- Convert to lowercase.
- Replace `milligram` or `milligrams` with `mg`.
- Replace `gram` or `grams` with `g`.
- Replace `milliliter` or `milliliters` with `ml`.

The original `dosage` remains unchanged.

### Generated fields

- `normalized_name` is generated from `name`.
- `normalized_dosage` is generated from `dosage`.
- Both fields are database-maintained and cannot depend on client-supplied normalized values.

### Duplicate indexes

- Store listings: unique `(store_id, normalized_name, normalized_dosage)` where `deleted_at IS NULL`.
- Manufacturer listings: unique `(manufacturer_id, normalized_name, normalized_dosage)` where `deleted_at IS NULL`.
- Deactivated, non-deleted listings remain in the duplicate set.
- Out-of-stock listings remain in the duplicate set.
- Soft-deleted listings are excluded and do not prevent reuse.

## Pricing implementation

- `consumer_price` is `numeric(12,2)`.
- `discount_percentage` is `numeric(5,2)`.
- `pharmacist_price_after_discount` is generated using PostgreSQL decimal arithmetic:

```text
round(consumer_price * (1 - discount_percentage / 100), 2)
```

No JavaScript floating-point calculation is used for the database field.

## Scope exclusions

The migration does not create or modify:

- Orders or order items
- Favorites
- Cart persistence
- Notifications
- Advertisements
- Pharmacy table
- Authentication trigger
- RLS policies
- RPC functions
- Stock reservation
- Application code or mock database
- Any data migration

## Assumptions and review concerns

1. Supabase clean projects require `citext` to be allowed by the extension mechanism.
2. Product dosage remains nullable for migration compatibility, while application submissions remain required by the existing UI.
3. POSIX `[[:space:]]` matching covers ordinary whitespace in PostgreSQL but should be tested with mixed Unicode names/dosages.
4. Dosage normalization replaces `gram`/`grams` before no unit conversion; it does not convert `500mg` to `0.5g`.
5. `source_manufacturer_id` is descriptive metadata and does not determine listing ownership.
6. Provider deletion behavior is intentionally `RESTRICT`; soft deletion is recommended.
7. Profile email uses Citext for case-insensitive uniqueness.
8. Account decisions remain foundational only; no RLS or workflow RPC is included.
9. Store and manufacturer statuses use separate fields with the same `provider_status` enum.
10. `updated_at` triggers are limited to the six foundational tables and do not introduce application behavior.

## Verification checklist

- [ ] Migration path follows Supabase timestamp naming conventions.
- [ ] SQL executes in a clean Supabase/PostgreSQL project.
- [ ] `pgcrypto` and `citext` extensions are available in the target project.
- [ ] Enum names do not conflict with existing project objects.
- [ ] `auth.users(id)` exists before profile creation.
- [ ] Profile role/status constraint permits no invalid combination.
- [ ] Rejected account requires a non-empty reason.
- [ ] Exactly one provider owner is enforced on all product rows.
- [ ] Generated normalized name and dosage update after display fields change.
- [ ] Store duplicate index works for active/non-deleted rows.
- [ ] Manufacturer duplicate index works for active/non-deleted rows.
- [ ] Soft-deleted products permit a replacement listing.
- [ ] Deactivated or out-of-stock products remain duplicate-protected.
- [ ] Consumer price, discount, stock, and availability constraints hold.
- [ ] Pharmacist price uses PostgreSQL numeric rounding.
- [ ] Source-manufacturer metadata is not treated as ownership.
- [ ] No RLS, orders, favorites, Auth trigger, RPC, or application behavior was introduced.
- [ ] No SQL or migration was executed against Supabase.
