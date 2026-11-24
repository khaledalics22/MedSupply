# MedSupply Supabase Authentication Implementation

**Status:** Implemented in application code; the required database migration has been prepared but not executed.

## Files created or modified

### Modified

- `src/lib/supabase.ts`
  - Added AsyncStorage-backed Supabase session persistence.
  - Enabled session persistence and automatic token refresh.

- `src/app/models/auth_service.ts`
  - Replaced the mock account/password backend with Supabase Auth.
  - Preserved the existing `AuthService` method API.
  - Added profile retrieval and account-status authorization.
  - Updated profile editing and password changes to use Supabase.
  - Preserved pharmacist management APIs for existing Admin screens.

- `src/app/state/auth_state.tsx`
  - Preserved the existing React context interface.
  - Added session restoration and Supabase auth-state listener cleanup.

### Created

- `supabase/migrations/202611240002_supabase_auth_profiles.sql`
  - Auth user profile trigger.
  - Initial profile and account-decision RLS policies.
  - Active-provider browse policies.

- `SUPABASE_AUTH_IMPLEMENTATION.md`
  - Implementation report.

## Authentication flow

### Registration

1. The AuthLayout submits existing registration fields.
2. Supabase `signUp` creates the Auth user.
3. The database trigger creates a `profiles` row with:
   - `role = pharmacist`
   - `account_status = pending`
   - No client-selectable role or status.
4. The mobile app signs out the newly registered user.
5. The UI continues to report pending approval until an Admin activates the account.

### Login

1. Supabase `signInWithPassword` authenticates the email/password.
2. The app retrieves the matching `profiles` row by the Auth user ID.
3. Admin users are allowed by server-stored role.
4. Pharmacists are allowed only with `account_status = active`.
5. Pending, rejected, and inactive pharmacists receive explicit messages and are signed out.

### Session restoration

- Supabase persists sessions in AsyncStorage through the centralized client.
- `restoreSession` re-fetches and validates the profile.
- Pending/inactive/rejected users are signed out and do not remain in application state.
- `SIGNED_IN`, `SIGNED_OUT`, and token refresh events are observed in AuthStateProvider.

### Logout

- Supabase `signOut` clears the persisted session.
- AuthStateProvider clears the application user through the auth-state listener.

## Secure profile creation

Profile creation is not performed by the mobile client.

The prepared SQL migration creates:

- A trigger on `auth.users` inserts.
- A fixed `pharmacist` role.
- A fixed `pending` account status.
- Profile fields sourced from Auth metadata and server metadata.
- A trigger `SECURITY DEFINER` function restricted to `supabase_auth_admin` execution.

The client metadata is not trusted for role or account status.

## RLS behavior included in the migration

The migration prepares:

- Own-profile select/update policy.
- Update protection against changing role, account status, or rejection reason.
- Own/account-admin decision read policy.
- Active specialties, stores, manufacturers, and provider listing browse policies.

No permissive migration policy allows public profile, order, or private account access.

## Required SQL migration

The migration must be reviewed and executed outside this implementation:

`supabase/migrations/202611240002_supabase_auth_profiles.sql`

The initial foundational migration remains unchanged at:

`supabase/migrations/202611240001_initial_medsupply_foundation.sql`

## Manual Supabase configuration

Before use:

1. Execute the Auth profile/RLS migration in Supabase.
2. Confirm email/password authentication is enabled.
3. Provision the initial Admin securely outside public registration.
4. Set the Admin `profiles.role = admin` and leave pharmacist account status null.
5. Confirm redirect/auth URL settings if email confirmation is enabled.
6. Configure the app `.env` with the public URL and anonymous/publishable key.
7. Test pending, rejected, inactive, active, and Admin states.

## Known limitations

- SecureStore could not be installed in the current workspace, so Supabase sessions use AsyncStorage rather than an encrypted secure-store adapter.
- The SQL migration has been prepared but not executed.
- RLS policies in the migration must be reviewed before execution.
- Admin approval/rejection UI is intentionally out of scope.
- Profile trigger execution depends on the migration being applied.
- Existing pending mock accounts are not migrated automatically.
- Supabase email confirmation behavior is controlled by the Supabase Dashboard and may require UI adjustments.

## Existing architecture preserved

- `Database` interface remains unchanged.
- `MockDatabase` remains active and unchanged.
- No order/product/provider database implementation was introduced.
- Authentication remains in the existing `AuthService`/`AuthStateProvider` structure.
