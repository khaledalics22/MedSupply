-- MedSupply provider minimum order values.
-- Prepared for review only. Do not execute until approved.

begin;

alter table public.stores
  add column if not exists minimum_order_value numeric(12,2) not null default 0;

alter table public.manufacturers
  add column if not exists minimum_order_value numeric(12,2) not null default 0;

-- Existing records receive zero while the column is added or populated.
update public.stores
set minimum_order_value = 0
where minimum_order_value is null;

update public.manufacturers
set minimum_order_value = 0
where minimum_order_value is null;

-- PostgreSQL constraint names are consistent across both provider tables.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'stores_minimum_order_value_nonnegative'
      and conrelid = 'public.stores'::regclass
  ) then
    alter table public.stores
      add constraint stores_minimum_order_value_nonnegative
      check (minimum_order_value >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'manufacturers_minimum_order_value_nonnegative'
      and conrelid = 'public.manufacturers'::regclass
  ) then
    alter table public.manufacturers
      add constraint manufacturers_minimum_order_value_nonnegative
      check (minimum_order_value >= 0);
  end if;
end
$$;

commit;
