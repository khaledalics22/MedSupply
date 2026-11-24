# MedSupply Supabase Auth Migration Security Fix

## Corrected file

`supabase/migrations/202611240002_supabase_auth_profiles.sql`

No SQL was executed and no other migration or application file was modified.

## Changes made

### Secure Auth trigger

- Fixed role to `pharmacist` using the `public.user_role` enum.
- Fixed account status to `pending` using `public.pharmacist_account_status`.
- Removed the `ON CONFLICT DO UPDATE` block so the trigger cannot update an existing profile or overwrite server-controlled fields.
- Changed `search_path` to an empty list.
- Added `pg_catalog` qualification for PostgreSQL functions.
- Removed broad function execution privileges and granted execution for the Auth trigger role.

### Recursive profile policies

Removed profile-RLS subqueries that queried `profiles` directly inside a `profiles` policy.

Added two non-recursive `SECURITY DEFINER` helpers:

- `is_profile_admin()` verifies the current Auth user has `role = admin` in `profiles`.
- `profile_sensitive_fields_unchanged(...)` verifies a profile update leaves role, account status, and rejection reason unchanged.

Both helpers use `set search_path = ''`, explicit `public` table references, and restricted execution grants.

### Profile protection

- Pharmacists can read only their own profile.
- Pharmacists can update only their own row.
- Profile updates cannot change role, account status, or rejection reason.
- Admin status is read from the database profile, not Auth metadata or client fields.

### Account decisions

- Pharmacists can read decisions only for their own profile.
- Admin status is verified by the database helper.
- The migration does not create decision-write privileges for ordinary users.

### Catalog browsing

- Specialties must be active.
- Stores and manufacturers must be active and not soft-deleted.
- Provider products must be available, non-deleted, have stock greater than zero, and belong to an active, non-deleted provider.

## Remaining limitations

- Pharmacist status cannot currently be changed through ordinary RLS; Admin status workflows require a later RPC/policy implementation.
- Public catalog policies may expose active catalog data as intended, but pending/rejected/inactive users should still be blocked from protected application features by application/session checks and future RPC authorization.
- Initial Admin provisioning must be performed securely outside public registration.
- The migration should be reviewed and executed only after the initial foundational migration is applied.
