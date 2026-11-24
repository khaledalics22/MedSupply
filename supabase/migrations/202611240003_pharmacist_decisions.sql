-- Secure pharmacist registration approval/rejection RPC functions.
-- Prepared for review only. Do not execute until approved.

begin;

create or replace function public.approve_pharmacist_registration(target_profile_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_profile public.profiles%rowtype;
  target_profile public.profiles%rowtype;
begin
  select * into caller_profile
  from public.profiles
  where id = auth.uid()
  for share;

  if caller_profile.id is null or caller_profile.role <> 'admin'::public.user_role then
    raise exception 'Only an Administrator can approve pharmacist registrations.' using errcode = '42501';
  end if;

  select * into target_profile
  from public.profiles
  where id = target_profile_id
  for update;

  if target_profile.id is null or target_profile.role <> 'pharmacist'::public.user_role then
    raise exception 'Pharmacist profile not found.' using errcode = 'P0002';
  end if;

  if target_profile.account_status is distinct from 'pending'::public.pharmacist_account_status then
    raise exception 'This pharmacist registration has already been processed.' using errcode = 'P0001';
  end if;

  update public.profiles
  set
    account_status = 'active'::public.pharmacist_account_status,
    rejection_reason = null,
    updated_at = pg_catalog.now()
  where id = target_profile_id;

  insert into public.account_decisions (
    profile_id,
    status,
    reason,
    decided_at
  ) values (
    target_profile_id,
    'approved'::public.account_decision_status,
    null,
    pg_catalog.now()
  );

  select * into target_profile
  from public.profiles
  where id = target_profile_id;

  return target_profile;
end;
$$;

create or replace function public.reject_pharmacist_registration(target_profile_id uuid, rejection_reason text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_profile public.profiles%rowtype;
  target_profile public.profiles%rowtype;
  reason_text text;
begin
  reason_text := pg_catalog.btrim(coalesce(rejection_reason, ''));
  if reason_text = '' then
    raise exception 'A rejection reason is required.' using errcode = '22023';
  end if;

  select * into caller_profile
  from public.profiles
  where id = auth.uid()
  for share;

  if caller_profile.id is null or caller_profile.role <> 'admin'::public.user_role then
    raise exception 'Only an Administrator can reject pharmacist registrations.' using errcode = '42501';
  end if;

  select * into target_profile
  from public.profiles
  where id = target_profile_id
  for update;

  if target_profile.id is null or target_profile.role <> 'pharmacist'::public.user_role then
    raise exception 'Pharmacist profile not found.' using errcode = 'P0002';
  end if;

  if target_profile.account_status is distinct from 'pending'::public.pharmacist_account_status then
    raise exception 'This pharmacist registration has already been processed.' using errcode = 'P0001';
  end if;

  update public.profiles
  set
    account_status = 'rejected'::public.pharmacist_account_status,
    rejection_reason = reason_text,
    updated_at = pg_catalog.now()
  where id = target_profile_id;

  insert into public.account_decisions (
    profile_id,
    status,
    reason,
    decided_at
  ) values (
    target_profile_id,
    'rejected'::public.account_decision_status,
    reason_text,
    pg_catalog.now()
  );

  select * into target_profile
  from public.profiles
  where id = target_profile_id;

  return target_profile;
end;
$$;

create or replace function public.set_pharmacist_inactive(target_profile_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_profile public.profiles%rowtype;
  target_profile public.profiles%rowtype;
begin
  select * into caller_profile
  from public.profiles
  where id = auth.uid()
  for share;

  if caller_profile.id is null or caller_profile.role <> 'admin'::public.user_role then
    raise exception 'Only an Administrator can deactivate pharmacists.' using errcode = '42501';
  end if;

  select * into target_profile
  from public.profiles
  where id = target_profile_id
  for update;

  if target_profile.id is null or target_profile.role <> 'pharmacist'::public.user_role then
    raise exception 'Pharmacist profile not found.' using errcode = 'P0002';
  end if;

  if target_profile.account_status is distinct from 'active'::public.pharmacist_account_status then
    raise exception 'Only an active pharmacist can be deactivated.' using errcode = 'P0001';
  end if;

  update public.profiles
  set
    account_status = 'inactive'::public.pharmacist_account_status,
    rejection_reason = null,
    updated_at = pg_catalog.now()
  where id = target_profile_id;

  insert into public.account_decisions (
    profile_id,
    status,
    reason,
    decided_at
  ) values (
    target_profile_id,
    'inactive'::public.account_decision_status,
    null,
    pg_catalog.now()
  );

  select * into target_profile
  from public.profiles
  where id = target_profile_id;

  return target_profile;
end;
$$;

create or replace function public.set_pharmacist_active(target_profile_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_profile public.profiles%rowtype;
  target_profile public.profiles%rowtype;
begin
  select * into caller_profile
  from public.profiles
  where id = auth.uid()
  for share;

  if caller_profile.id is null or caller_profile.role <> 'admin'::public.user_role then
    raise exception 'Only an Administrator can reactivate pharmacists.' using errcode = '42501';
  end if;

  select * into target_profile
  from public.profiles
  where id = target_profile_id
  for update;

  if target_profile.id is null or target_profile.role <> 'pharmacist'::public.user_role then
    raise exception 'Pharmacist profile not found.' using errcode = 'P0002';
  end if;

  if target_profile.account_status is distinct from 'inactive'::public.pharmacist_account_status then
    raise exception 'Only an inactive pharmacist can be reactivated.' using errcode = 'P0001';
  end if;

  update public.profiles
  set
    account_status = 'active'::public.pharmacist_account_status,
    rejection_reason = null,
    updated_at = pg_catalog.now()
  where id = target_profile_id;

  insert into public.account_decisions (
    profile_id,
    status,
    reason,
    decided_at
  ) values (
    target_profile_id,
    'reactivated'::public.account_decision_status,
    null,
    pg_catalog.now()
  );

  select * into target_profile
  from public.profiles
  where id = target_profile_id;

  return target_profile;
end;
$$;

revoke all on function public.approve_pharmacist_registration(uuid) from public, anon, authenticated;
revoke all on function public.reject_pharmacist_registration(uuid, text) from public, anon, authenticated;
revoke all on function public.set_pharmacist_inactive(uuid) from public, anon, authenticated;
revoke all on function public.set_pharmacist_active(uuid) from public, anon, authenticated;

grant execute on function public.approve_pharmacist_registration(uuid) to authenticated;
grant execute on function public.reject_pharmacist_registration(uuid, text) to authenticated;
grant execute on function public.set_pharmacist_inactive(uuid) to authenticated;
grant execute on function public.set_pharmacist_active(uuid) to authenticated;

-- Admins can select every pharmacist profile. This policy is non-recursive.
drop policy if exists "profiles_select_admin_all" on public.profiles;
create policy "profiles_select_admin_all"
  on public.profiles
  for select
  using (public.is_profile_admin());

commit;
