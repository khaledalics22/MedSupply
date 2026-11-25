-- MedSupply provider CRUD RLS policies.
-- Prepared for review only. Do not execute until approved.

begin;

-- Admin provider writes. Admin status is read from profiles, not client metadata.
drop policy if exists "stores_insert_admin" on public.stores;
create policy "stores_insert_admin"
  on public.stores
  for insert
  to authenticated
  with check (public.is_profile_admin());

drop policy if exists "stores_update_admin" on public.stores;
create policy "stores_update_admin"
  on public.stores
  for update
  to authenticated
  using (public.is_profile_admin())
  with check (public.is_profile_admin());

drop policy if exists "manufacturers_insert_admin" on public.manufacturers;
create policy "manufacturers_insert_admin"
  on public.manufacturers
  for insert
  to authenticated
  with check (public.is_profile_admin());

drop policy if exists "manufacturers_update_admin" on public.manufacturers;
create policy "manufacturers_update_admin"
  on public.manufacturers
  for update
  to authenticated
  using (public.is_profile_admin())
  with check (public.is_profile_admin());

-- Existing browsing policies from 202611240002 already restrict active providers.
-- Add explicit role-qualified select policies for admins as needed.
drop policy if exists "stores_select_admin_all" on public.stores;
create policy "stores_select_admin_all"
  on public.stores
  for select
  to authenticated
  using (public.is_profile_admin());

drop policy if exists "manufacturers_select_admin_all" on public.manufacturers;
create policy "manufacturers_select_admin_all"
  on public.manufacturers
  for select
  to authenticated
  using (public.is_profile_admin());

commit;
