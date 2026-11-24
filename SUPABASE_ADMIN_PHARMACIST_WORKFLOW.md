# MedSupply Admin Pharmacist Approval Workflow

## Implemented files

### Modified

- `src/app/models/auth_service.ts`
  - Added RPC dispatch for pharmacist approval, rejection, deactivation, and reactivation.
  - Removed direct profile status updates and direct account-decision inserts from the service method.
  - Preserved existing `getPharmacists`, `setPharmacistStatus`, and UI-facing return types.

- `src/app/layouts/pharmacist_detail_layout/index.tsx`
  - Added duplicate-submission guards for approve/reject operations.
  - Added processing-state feedback.
  - Preserved existing confirmation dialogs and success/error feedback.

### Created

- `supabase/migrations/202611240003_pharmacist_decisions.sql`
  - Secure approve/reject RPC functions.
  - Secure deactivate/reactivate RPC functions for existing UI behavior.
  - Atomic profile updates plus account decision inserts.
  - Admin-only profile read policy for pharmacist management.

- `SUPABASE_ADMIN_PHARMACIST_WORKFLOW.md`
  - Implementation and manual migration report.

## RPC functions

- `approve_pharmacist_registration(target_profile_id)`
  - Admin-only.
  - Requires Pending status.
  - Sets Active and clears rejection reason.
  - Inserts an Approved account decision.

- `reject_pharmacist_registration(target_profile_id, rejection_reason)`
  - Admin-only.
  - Requires Pending status and non-empty reason.
  - Sets Rejected and stores the rejection reason.
  - Inserts a Rejected account decision.

- `set_pharmacist_inactive(target_profile_id)`
  - Admin-only.
  - Allows only Active pharmacists to deactivate.
  - Inserts an Inactive decision.

- `set_pharmacist_active(target_profile_id)`
  - Admin-only.
  - Reactivates only Inactive pharmacists.
  - Inserts a Reactivated decision.

## Security

- Admin role is verified from `profiles.role` inside each SECURITY DEFINER RPC.
- Every status decision uses row locking and database-side Pending/Active/Inactive validation.
- Profile status and account decision insert occur in the same PostgreSQL transaction.
- Duplicate decisions are rejected because Pending/Active/Inactive status is checked after locking.
- RPC functions use `set search_path = ''` and explicit public schema object references.
- Execution is granted only to `authenticated`; public and anon execution is revoked.
- The client cannot call unrestricted direct profile updates for the workflow.

## UI behavior

- Existing Admin dashboard already displays a dynamic Pending Pharmacist count.
- Existing pharmacist management screen filters Pending registrations.
- Existing pharmacist detail screen provides review and approval/rejection dialogs.
- Approval/rejection handlers prevent duplicate submissions while RPC calls run.
- Successful actions refresh pharmacist detail/profile state.
- Already-processed requests return a clear RPC error.

## Manual Supabase step

Run this migration in the Supabase SQL Editor:

```text
supabase/migrations/202611240003_pharmacist_decisions.sql
```

Do not execute it automatically.

## Validation still required

After applying the migration:

1. Verify a non-Admin RPC call is denied.
2. Approve a Pending pharmacist and confirm profile status plus Approved decision.
3. Reject a Pending pharmacist and confirm reason/status plus Rejected decision.
4. Retry both RPCs for an already processed pharmacist and confirm rejection.
5. Confirm a Pending pharmacist cannot log in until approval.
6. Confirm an Approved pharmacist can log in.

No migration or database operation was executed by this implementation.
