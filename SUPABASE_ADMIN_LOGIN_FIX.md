# MedSupply Admin Login Fix

## Root cause

The Admin login failure was not caused by `account_status = NULL` in `getAuthorizedProfile`. The function explicitly returns an Admin immediately after converting the profile:

```text
if (user.role === 'admin') return user;
```

The displayed error was produced earlier by the generic profile-query result handling:

```text
if (error) throw new Error('Unable to retrieve your profile.');
```

This discarded the underlying Supabase/PostgreSQL error code and message.

## RLS finding

The profile should be accessible to an Admin through one of:

- `profiles_select_own`: Admin profile ID is readable by the Auth user's own ID.
- `profiles_select_admin_all`: Admin helper allows all profile reads.

The Admin-specific helper uses `SECURITY DEFINER` with `set search_path = ''` and reads `profiles` for the current Auth UID. It is non-recursive in normal policy evaluation.

A separate RLS issue is possible if the helper or policies have not been applied, but the application logic itself correctly handles `account_status = NULL` for Admin users.

## Application correction

Updated `src/app/models/auth_service.ts`:

- Uses `supabase.auth.getUser()` to verify the active Auth identity.
- Preserves the profile SELECT by Auth user ID.
- Returns actual profile-query code/message:
  - Auth errors include code and message.
  - Database/profile RLS errors include code and message.
- Keeps the existing Admin-first status branch.
- Keeps pharmacist pending/rejected/inactive/active checks unchanged.

## Result

The application no longer reports only the generic `Unable to retrieve your profile` message. The underlying RLS or database error is now visible for diagnosis.

No database migrations or RLS policies were changed.
