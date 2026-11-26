-- MedSupply persistent orders database schema and read-only RLS.
-- Scope: enum, orders, order provider groups, order items, indexes, and SELECT policies.
-- Prepared for review only. Do not execute until approved.

begin;

-- Order status is intentionally created once and is not modified here.
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'order_status'
  ) then
    execute 'create type public.order_status as enum (''pending'', ''approved'', ''rejected'', ''completed'')';
  end if;
end
$$;

-- Provider type matches the existing Store/Manufacturer ownership model.
do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'order_provider_type'
  ) then
    execute 'create type public.order_provider_type as enum (''store'', ''manufacturer'')';
  end if;
end
$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  pharmacist_id uuid not null references public.profiles(id) on delete restrict,
  status public.order_status not null default 'pending',
  total_quantity integer not null,
  line_count integer not null,
  subtotal_amount numeric(12,2) not null,
  discount_amount numeric(12,2) not null,
  total_amount numeric(12,2) not null,
  rejection_reason text,
  stock_deducted boolean not null default false,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  rejected_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),

  constraint orders_total_quantity_positive check (total_quantity > 0),
  constraint orders_line_count_positive check (line_count > 0),
  constraint orders_monetary_values_nonnegative check (
    subtotal_amount >= 0
    and discount_amount >= 0
    and total_amount >= 0
  ),
  constraint orders_rejection_reason_consistent check (
    (status = 'rejected' and btrim(coalesce(rejection_reason, '')) <> '' and rejected_at is not null)
    or
    (status is distinct from 'rejected' and rejection_reason is null)
  ),
  constraint orders_stock_deducted_status_consistent check (
    (status in ('pending', 'rejected') and stock_deducted = false)
    or
    (status in ('approved', 'completed') and stock_deducted = true)
  ),
  constraint orders_approval_timestamp_consistent check (
    (status = 'pending' and approved_at is null)
    or
    (status = 'rejected' and approved_at is null)
    or
    (status = 'approved' and approved_at is not null and completed_at is null)
    or
    (status = 'completed' and approved_at is not null and completed_at is not null)
  ),
  constraint orders_rejected_timestamp_consistent check (
    (status = 'rejected' and rejected_at is not null)
    or
    (status is distinct from 'rejected' and rejected_at is null)
  ),
  constraint orders_completed_timestamp_consistent check (
    (status = 'completed' and completed_at is not null)
    or
    (status is distinct from 'completed' and completed_at is null)
  )
);

create table if not exists public.order_provider_groups (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  provider_type public.order_provider_type not null,
  store_id uuid references public.stores(id) on delete restrict,
  manufacturer_id uuid references public.manufacturers(id) on delete restrict,
  provider_name text not null,
  minimum_order_value_snapshot numeric(12,2) not null,
  subtotal_before_discount_snapshot numeric(12,2) not null,
  subtotal_after_discount_snapshot numeric(12,2) not null,
  total_quantity integer not null,
  line_count integer not null,
  created_at timestamptz not null default now(),

  constraint order_provider_groups_id_order_unique unique (id, order_id),
  constraint order_provider_groups_provider_name_required check (btrim(provider_name) <> ''),
  constraint order_provider_groups_exactly_one_provider check (
    (store_id is not null and manufacturer_id is null)
    or
    (store_id is null and manufacturer_id is not null)
  ),
  constraint order_provider_groups_provider_type_consistent check (
    (provider_type = 'store' and store_id is not null and manufacturer_id is null)
    or
    (provider_type = 'manufacturer' and manufacturer_id is not null and store_id is null)
  ),
  constraint order_provider_groups_monetary_values_nonnegative check (
    minimum_order_value_snapshot >= 0
    and subtotal_before_discount_snapshot >= 0
    and subtotal_after_discount_snapshot >= 0
  ),
  constraint order_provider_groups_quantity_positive check (total_quantity > 0),
  constraint order_provider_groups_line_count_positive check (line_count > 0)
);

create unique index if not exists order_provider_groups_one_store_per_order_idx
  on public.order_provider_groups (order_id, store_id)
  where store_id is not null;

create unique index if not exists order_provider_groups_one_manufacturer_per_order_idx
  on public.order_provider_groups (order_id, manufacturer_id)
  where manufacturer_id is not null;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  provider_group_id uuid not null,
  product_id uuid references public.provider_products(id) on delete set null,
  product_name text not null,
  dosage text,
  package_size text,
  variant text,
  specialty_name text,
  consumer_unit_price numeric(12,2) not null,
  discount_percentage numeric(5,2) not null default 0,
  final_unit_price numeric(12,2) not null,
  quantity integer not null,
  line_subtotal_before_discount numeric(12,2) not null,
  line_subtotal_after_discount numeric(12,2) not null,
  created_at timestamptz not null default now(),

  constraint order_items_product_name_required check (btrim(product_name) <> ''),
  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_monetary_values_nonnegative check (
    consumer_unit_price >= 0
    and final_unit_price >= 0
    and line_subtotal_before_discount >= 0
    and line_subtotal_after_discount >= 0
  ),
  constraint order_items_discount_percentage_valid check (
    discount_percentage >= 0
    and discount_percentage <= 100
  ),
  constraint order_items_provider_group_matches_order foreign key (provider_group_id, order_id)
    references public.order_provider_groups(id, order_id)
    on delete restrict
);

-- Query and foreign-key indexes.
create index if not exists orders_pharmacist_created_at_idx
  on public.orders (pharmacist_id, created_at desc);

create index if not exists orders_status_created_at_idx
  on public.orders (status, created_at desc);

create index if not exists order_provider_groups_order_id_idx
  on public.order_provider_groups (order_id);

create index if not exists order_provider_groups_store_id_idx
  on public.order_provider_groups (store_id);

create index if not exists order_provider_groups_manufacturer_id_idx
  on public.order_provider_groups (manufacturer_id);

create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

create index if not exists order_items_product_id_idx
  on public.order_items (product_id);

CREATE INDEX IF NOT EXISTS order_items_provider_group_order_id_idx
    ON public.order_items (provider_group_id, order_id);

-- Maintain updated_at using the existing project trigger function.
drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.set_medsupply_updated_at();

-- Enable RLS on all new order tables.
alter table public.orders enable row level security;
alter table public.order_provider_groups enable row level security;
alter table public.order_items enable row level security;

-- Existing is_profile_admin() helper is SECURITY DEFINER and is granted to authenticated.
-- Pharmacist read policies require an active pharmacist profile.
drop policy if exists "orders_select_own_pharmacist" on public.orders;
create policy "orders_select_own_pharmacist"
  on public.orders
  for select
  to authenticated
  using (
    pharmacist_id = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'pharmacist'::public.user_role
        and p.account_status = 'active'::public.pharmacist_account_status
    )
  );

drop policy if exists "orders_select_admin_all" on public.orders;
create policy "orders_select_admin_all"
  on public.orders
  for select
  to authenticated
  using (public.is_profile_admin());

drop policy if exists "order_provider_groups_select_owned_or_admin" on public.order_provider_groups;
create policy "order_provider_groups_select_owned_or_admin"
  on public.order_provider_groups
  for select
  to authenticated
  using (
    public.is_profile_admin()
    or exists (
      select 1
      from public.orders o
      join public.profiles p on p.id = o.pharmacist_id
      where o.id = order_provider_groups.order_id
        and o.pharmacist_id = auth.uid()
        and p.role = 'pharmacist'::public.user_role
        and p.account_status = 'active'::public.pharmacist_account_status
    )
  );

drop policy if exists "order_items_select_owned_or_admin" on public.order_items;
create policy "order_items_select_owned_or_admin"
  on public.order_items
  for select
  to authenticated
  using (
    public.is_profile_admin()
    or exists (
      select 1
      from public.orders o
      join public.profiles p on p.id = o.pharmacist_id
      where o.id = order_items.order_id
        and o.pharmacist_id = auth.uid()
        and p.role = 'pharmacist'::public.user_role
        and p.account_status = 'active'::public.pharmacist_account_status
    )
  );

-- Apply least privilege: no direct writes and no anon access.
revoke all on table public.orders from anon, authenticated;
revoke all on table public.order_provider_groups from anon, authenticated;
revoke all on table public.order_items from anon, authenticated;

grant select on table public.orders to authenticated;
grant select on table public.order_provider_groups to authenticated;
grant select on table public.order_items to authenticated;

revoke all on type public.order_status from anon, authenticated;
revoke all on type public.order_provider_type from anon, authenticated;
grant usage on type public.order_status to authenticated;
grant usage on type public.order_provider_type to authenticated;

commit;
