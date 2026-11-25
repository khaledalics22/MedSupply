-- MedSupply provider-product management RLS policies.

begin;

-- Admin can create products.
drop policy if exists "provider_products_insert_admin" on public.provider_products;
create policy "provider_products_insert_admin"
  on public.provider_products
  for insert
  to authenticated
  with check (public.is_profile_admin());

-- Admin can update, deactivate, reactivate, and soft-delete products.
drop policy if exists "provider_products_update_admin" on public.provider_products;
create policy "provider_products_update_admin"
  on public.provider_products
  for update
  to authenticated
  using (public.is_profile_admin())
  with check (public.is_profile_admin());

-- Admin can view all products, including unavailable and deleted products.
drop policy if exists "provider_products_select_admin_all" on public.provider_products;
create policy "provider_products_select_admin_all"
  on public.provider_products
  for select
  to authenticated
  using (public.is_profile_admin());

-- Required SQL privileges; RLS still controls which rows/actions are allowed.
grant select, insert, update
on table public.provider_products
to authenticated;

commit;