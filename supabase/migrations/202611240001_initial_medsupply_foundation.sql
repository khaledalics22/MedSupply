-- MedSupply initial foundational Supabase schema.
-- Scope: profiles, account decisions, specialties, stores, manufacturers, and provider-owned products.
-- Excludes: orders, favorites, RLS policies, Auth triggers, RPC functions, and data migration.
-- RLS is enabled below with no policies.

begin;

-- Supabase commonly exposes citext in the extensions schema. IF NOT EXISTS
-- does not relocate an existing installation, so the column uses unqualified
-- citext and resolves against the actual installed type/search path.
create extension if not exists citext with schema extensions;

create type public.user_role as enum ('admin', 'pharmacist');

create type public.pharmacist_account_status as enum (
  'pending',
  'active',
  'rejected',
  'inactive'
);

create type public.account_decision_status as enum (
  'approved',
  'rejected',
  'inactive',
  'reactivated'
);

create type public.provider_status as enum ('active', 'inactive');

create or replace function public.normalize_medsupply_name(value text)
returns text
language sql
immutable
strict
as $$
  select btrim(regexp_replace(lower(value), '[[:space:]]+', ' ', 'g'));
$$;

create or replace function public.normalize_medsupply_dosage(value text)
returns text
language sql
immutable
as $$
  select regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(lower(coalesce(value, '')), '[[:space:]]+', '', 'g'),
        'milligrams?',
        'mg',
        'g'
      ),
      'milliliters?',
      'ml',
      'g'
    ),
    'grams?',
    'g',
    'g'
  );
$$;

create or replace function public.set_medsupply_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  legacy_id text,
  role public.user_role not null,
  full_name text not null,
  email extensions.citext not null unique,
  phone text,
  profile_picture text,
  pharmacy_name text,
  pharmacy_address text,
  account_status public.pharmacist_account_status,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_legacy_id_unique unique (legacy_id),
  constraint profiles_full_name_required check (btrim(full_name) <> ''),
  constraint profiles_email_required check (btrim(email) <> ''),
  constraint profiles_role_status_consistent check (
    (role = 'admin' and account_status is null)
    or
    (role = 'pharmacist' and account_status is not null)
  ),
  constraint profiles_rejected_reason_consistent check (
    (account_status = 'rejected' and btrim(coalesce(rejection_reason, '')) <> '')
    or
    (account_status is distinct from 'rejected' and rejection_reason is null)
  )
);

create table public.account_decisions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  status public.account_decision_status not null,
  reason text,
  decided_at timestamptz not null default now(),

  constraint account_decisions_rejected_reason_required check (
    status <> 'rejected' or btrim(coalesce(reason, '')) <> ''
  )
);

create index account_decisions_profile_decided_at_idx
  on public.account_decisions(profile_id, decided_at desc);

create table public.specialties (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  name text not null,
  description text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint specialties_legacy_id_unique unique (legacy_id),
  constraint specialties_name_required check (btrim(name) <> '')
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  name text not null,
  description text,
  image_url text,
  address text,
  location jsonb,
  phone text,
  contact_person text,
  open_hours text,
  rating numeric(3,2),
  status public.provider_status not null default 'active',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint stores_legacy_id_unique unique (legacy_id),
  constraint stores_name_required check (btrim(name) <> ''),
  constraint stores_rating_range check (rating is null or (rating >= 0 and rating <= 5)),
  constraint stores_deleted_inactive_consistent check (
    deleted_at is null or status = 'inactive'
  )
);

create table public.manufacturers (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  name text not null,
  description text,
  image_url text,
  address text,
  location jsonb,
  phone text,
  contact_person text,
  certification text,
  production_capacity text,
  status public.provider_status not null default 'active',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint manufacturers_legacy_id_unique unique (legacy_id),
  constraint manufacturers_name_required check (btrim(name) <> ''),
  constraint manufacturers_deleted_inactive_consistent check (
    deleted_at is null or status = 'inactive'
  )
);

create table public.provider_products (
  id uuid primary key default gen_random_uuid(),
  legacy_id text,
  store_id uuid references public.stores(id) on delete restrict,
  manufacturer_id uuid references public.manufacturers(id) on delete restrict,
  specialty_id uuid not null references public.specialties(id) on delete restrict,
  name text not null,
  normalized_name text not null generated always as (public.normalize_medsupply_name(name)) stored,
  description text,
  image_url text,
  dosage text,
  normalized_dosage text not null generated always as (public.normalize_medsupply_dosage(dosage)) stored,
  package_size text,
  variant text,
  barcode text,
  expiry_date date,
  source_manufacturer_id uuid references public.manufacturers(id) on delete restrict,
  source_manufacturer_name text,
  consumer_price numeric(12,2) not null,
  discount_percentage numeric(5,2) not null default 0,
  pharmacist_price_after_discount numeric(12,2) generated always as (
    round(
      consumer_price * (1 - discount_percentage / 100),
      2
    )
  ) stored,
  stock_quantity integer not null default 0,
  is_available boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint provider_products_legacy_id_unique unique (legacy_id),
  constraint provider_products_name_required check (btrim(name) <> ''),
  constraint provider_products_exactly_one_owner check (
    (store_id is not null and manufacturer_id is null)
    or
    (store_id is null and manufacturer_id is not null)
  ),
  constraint provider_products_consumer_price_positive check (consumer_price > 0),
  constraint provider_products_discount_range check (
    discount_percentage >= 0 and discount_percentage <= 100
  ),
  constraint provider_products_stock_nonnegative check (stock_quantity >= 0),
  constraint provider_products_zero_stock_unavailable check (
    stock_quantity <> 0 or is_available = false
  ),
  constraint provider_products_deleted_unavailable check (
    deleted_at is null or is_available = false
  )
);

create unique index provider_products_store_unique_active_idx
  on public.provider_products(store_id, normalized_name, normalized_dosage)
  where deleted_at is null and store_id is not null;

create unique index provider_products_manufacturer_unique_active_idx
  on public.provider_products(manufacturer_id, normalized_name, normalized_dosage)
  where deleted_at is null and manufacturer_id is not null;

create index provider_products_store_available_idx
  on public.provider_products(store_id, is_available, deleted_at)
  where store_id is not null;

create index provider_products_manufacturer_available_idx
  on public.provider_products(manufacturer_id, is_available, deleted_at)
  where manufacturer_id is not null;

create index provider_products_specialty_available_idx
  on public.provider_products(specialty_id, is_available, deleted_at);

create index provider_products_stock_idx
  on public.provider_products(stock_quantity);

alter table public.profiles enable row level security;
alter table public.account_decisions enable row level security;
alter table public.specialties enable row level security;
alter table public.stores enable row level security;
alter table public.manufacturers enable row level security;
alter table public.provider_products enable row level security;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_medsupply_updated_at();

create trigger specialties_set_updated_at
before update on public.specialties
for each row execute function public.set_medsupply_updated_at();

create trigger stores_set_updated_at
before update on public.stores
for each row execute function public.set_medsupply_updated_at();

create trigger manufacturers_set_updated_at
before update on public.manufacturers
for each row execute function public.set_medsupply_updated_at();

create trigger provider_products_set_updated_at
before update on public.provider_products
for each row execute function public.set_medsupply_updated_at();

commit;
