-- MedSupply: restore stock when an Admin rejects a pending order.
-- Scope: reject_order and rejected-order stock consistency/backfill.
-- Prepared for review only. Do not execute until approved.

begin;

-- Drop the current constraint before setting old rejected orders to stock_deducted=false.
alter table public.orders
  drop constraint if exists orders_stock_deducted_status_consistent;

-- Existing rejected test orders that still have stock_deducted=true need a one-time restoration.
-- Migration 1 can have normalized old rejected orders from false to true, so false means already restored.
do $migration$
declare
  v_order public.orders%rowtype;
  v_restore record;
  v_missing_product_id uuid;
  v_rows_updated integer;
begin
  create temporary table pg_temp.rejected_order_backfill_ids (
    order_id uuid primary key
  ) on commit drop;

  create temporary table pg_temp.rejected_stock_backfill (
    product_id uuid primary key,
    quantity bigint not null
  ) on commit drop;

  -- Lock candidate orders and aggregate their persisted item quantities.
  for v_order in
    select o.*
    from public.orders o
    where o.status = 'rejected'::public.order_status
      and o.stock_deducted is true
    order by o.id
    for update of o
  loop
    insert into pg_temp.rejected_order_backfill_ids(order_id)
    values (v_order.id)
    on conflict do nothing;

    if exists (
      select 1
      from public.order_items oi
      where oi.order_id = v_order.id
        and oi.product_id is null
    ) then
      raise exception 'Cannot restore stock for rejected order % because an order item has no product ID.',
        v_order.id using errcode = 'P0002';
    end if;

    insert into pg_temp.rejected_stock_backfill(product_id, quantity)
    select
      oi.product_id,
      pg_catalog.sum(oi.quantity::bigint)
    from public.order_items oi
    where oi.order_id = v_order.id
      and oi.product_id is not null
    group by oi.product_id
    on conflict (product_id) do update
    set quantity = pg_temp.rejected_stock_backfill.quantity + excluded.quantity;
  end loop;

  select r.product_id
  into v_missing_product_id
  from pg_temp.rejected_stock_backfill r
  left join public.provider_products p on p.id = r.product_id
  where p.id is null
  order by r.product_id
  limit 1;

  if v_missing_product_id is not null then
    raise exception 'Cannot restore stock because product % no longer exists.',
      v_missing_product_id using errcode = 'P0002';
  end if;

  -- Lock affected product rows deterministically and restore stock.
  for v_restore in
    select
      r.product_id,
      r.quantity,
      p.stock_quantity
    from pg_temp.rejected_stock_backfill r
    join public.provider_products p on p.id = r.product_id
    order by r.product_id
    for update of p
  loop
    if v_restore.quantity > 2147483647::bigint
       or v_restore.stock_quantity::bigint + v_restore.quantity > 2147483647::bigint
    then
      raise exception 'Restoring stock for product % exceeds the supported integer range.',
        v_restore.product_id using errcode = '22023';
    end if;

    update public.provider_products
    set stock_quantity = stock_quantity + v_restore.quantity::integer
    where id = v_restore.product_id;

    get diagnostics v_rows_updated = row_count;
    if v_rows_updated <> 1 then
      raise exception 'Could not restore stock for product %.',
        v_restore.product_id using errcode = 'P0002';
    end if;
  end loop;

  -- Mark only rejected orders selected by the backfill as restored.
  update public.orders o
  set stock_deducted = false
  where o.id in (
    select r.order_id
    from pg_temp.rejected_order_backfill_ids r
  );
end;
$migration$;

-- Replace the old stock consistency constraint after backfill so rejected orders are restored.
alter table public.orders
  add constraint orders_stock_deducted_status_consistent
  check (
    (status = 'rejected'::public.order_status and stock_deducted = false)
    or
    (status in ('pending'::public.order_status, 'approved'::public.order_status, 'completed'::public.order_status)
     and stock_deducted = true)
  );

create or replace function public.reject_order(target_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_caller uuid;
  v_order public.orders%rowtype;
  v_restore record;
  v_missing_product_id uuid;
  v_rows_updated integer;
  v_rejection_reason text := 'Rejected by administrator.';
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if not public.is_profile_admin() then
    raise exception 'Only administrators can reject orders.' using errcode = '42501';
  end if;

  if target_order_id is null then
    raise exception 'A valid order ID is required.' using errcode = '22023';
  end if;

  select o.*
  into v_order
  from public.orders o
  where o.id = target_order_id
  for update;

  if v_order.id is null then
    raise exception 'Order does not exist.' using errcode = 'P0002';
  end if;

  if v_order.status <> 'pending'::public.order_status then
    raise exception 'Only pending orders can be rejected.' using errcode = 'P0001';
  end if;

  if v_order.stock_deducted is distinct from true then
    raise exception 'Pending order stock has not been recorded as deducted.' using errcode = 'P0001';
  end if;

  create temporary table pg_temp.reject_stock_restores (
    product_id uuid primary key,
    quantity bigint not null
  ) on commit drop;

  if exists (
    select 1
    from public.order_items oi
    where oi.order_id = target_order_id
      and oi.product_id is null
  ) then
    raise exception 'Cannot restore stock for order % because an order item has no product ID.',
      target_order_id using errcode = 'P0002';
  end if;

  insert into pg_temp.reject_stock_restores(product_id, quantity)
  select
    oi.product_id,
    pg_catalog.sum(oi.quantity::bigint)
  from public.order_items oi
  where oi.order_id = target_order_id
    and oi.product_id is not null
  group by oi.product_id;

  select r.product_id
  into v_missing_product_id
  from pg_temp.reject_stock_restores r
  left join public.provider_products p on p.id = r.product_id
  where p.id is null
  order by r.product_id
  limit 1;

  if v_missing_product_id is not null then
    raise exception 'Cannot restore stock because product % no longer exists.',
      v_missing_product_id using errcode = 'P0002';
  end if;

  -- Lock affected product rows deterministically before restoring stock.
  for v_restore in
    select
      r.product_id,
      r.quantity,
      p.stock_quantity
    from pg_temp.reject_stock_restores r
    join public.provider_products p on p.id = r.product_id
    order by r.product_id
    for update of p
  loop
    if v_restore.quantity > 2147483647::bigint
       or v_restore.stock_quantity::bigint + v_restore.quantity > 2147483647::bigint
    then
      raise exception 'Restoring stock for product % exceeds the supported integer range.',
        v_restore.product_id using errcode = '22023';
    end if;

    update public.provider_products
    set stock_quantity = stock_quantity + v_restore.quantity::integer
    where id = v_restore.product_id;

    get diagnostics v_rows_updated = row_count;
    if v_rows_updated <> 1 then
      raise exception 'Could not restore stock for product %.',
        v_restore.product_id using errcode = 'P0002';
    end if;
  end loop;

  update public.orders
  set
    status = 'rejected'::public.order_status,
    rejection_reason = v_rejection_reason,
    rejected_at = pg_catalog.now(),
    approved_at = null,
    completed_at = null,
    stock_deducted = false
  where id = target_order_id;

  return pg_catalog.jsonb_build_object(
    'order_id', target_order_id,
    'status', 'rejected'
  );
end;
$function$;

revoke execute on function public.reject_order(uuid) from public, anon, authenticated;
grant execute on function public.reject_order(uuid) to authenticated;

commit;
