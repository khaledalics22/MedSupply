-- MedSupply Supabase Auth profile trigger and initial authentication RLS.
-- Prepared for review only. Do not execute until approved.

begin;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id, legacy_id, role, full_name, email, phone, profile_picture,
    pharmacy_name, pharmacy_address, account_status, rejection_reason,
    created_at, updated_at
  )
  values (
    new.id,
    null,
    'pharmacist'::public.user_role,
    coalesce(nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'full_name'), ''), 'Pharmacist'),
    new.email,
    nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'phone'), ''),
    null,
    nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'pharmacy_name'), ''),
    nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'pharmacy_address'), ''),
    'pending'::public.pharmacist_account_status,
    null,
    coalesce(new.created_at, pg_catalog.now()),
    pg_catalog.now()
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;


drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Non-recursive authorization helpers.
create or replace function public.is_profile_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'::public.user_role
  );
$$;

create or replace function public.profile_sensitive_fields_unchanged(
  requested_role public.user_role,
  requested_status public.pharmacist_account_status,
  requested_rejection_reason text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = requested_role
      and p.account_status = requested_status
      and p.rejection_reason is not distinct from requested_rejection_reason
  );
$$;

revoke all on function public.is_profile_admin() from public, anon;
revoke all on function public.profile_sensitive_fields_unchanged(public.user_role, public.pharmacist_account_status, text) from public, anon;
grant execute on function public.is_profile_admin() to authenticated;
grant execute on function public.profile_sensitive_fields_unchanged(public.user_role, public.pharmacist_account_status, text) to authenticated;

-- Profile access: users can read/update only their own profile.
-- Role, account status, and rejection reason are enforced as immutable.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_update_own_safe_fields" on public.profiles;
create policy "profiles_update_own_safe_fields"
on public.profiles
for update
using (auth.uid() = id)
with check (
  auth.uid() = id
  and public.profile_sensitive_fields_unchanged(role, account_status, rejection_reason)
);

-- Account decisions can only be read by the owning pharmacist or an Admin.
drop policy if exists "account_decisions_select_own_or_admin" on public.account_decisions;
create policy "account_decisions_select_own_or_admin"
on public.account_decisions
for select
using (
  auth.uid() = profile_id
  or public.is_profile_admin()
);

-- Store/manufacturer/specialty browsing is public only for active rows.
drop policy if exists "specialties_select_active" on public.specialties;
create policy "specialties_select_active"
on public.specialties
for select
using (is_active = true);

drop policy if exists "stores_select_active" on public.stores;
create policy "stores_select_active"
  on public.stores
  for select
  using (status = 'active'::public.provider_status and deleted_at is null);

drop policy if exists "manufacturers_select_active" on public.manufacturers;
create policy "manufacturers_select_active"
  on public.manufacturers
  for select
  using (status = 'active'::public.provider_status and deleted_at is null);

drop policy if exists "provider_products_select_active" on public.provider_products;
create policy "provider_products_select_active"
  on public.provider_products
  for select
  using (
    is_available = true
    and deleted_at is null
    and stock_quantity > 0
    and (
      (store_id is not null and exists (
        select 1 from public.stores store
        where store.id = provider_products.store_id
          and store.status = 'active'::public.provider_status
          and store.deleted_at is null
      ))
      or
      (manufacturer_id is not null and exists (
        select 1 from public.manufacturers manufacturer
        where manufacturer.id = provider_products.manufacturer_id
          and manufacturer.status = 'active'::public.provider_status
          and manufacturer.deleted_at is null
      ))
    )
  );

COMMIT;