-- MedSupply Migration 1: immediate stock deduction during order submission.
-- Scope: order stock-deduction constraint, product availability constraint, create_order.
-- Prepared for review only. Do not execute until approved.

begin;

-- 1. Remove the old status/stock-deduction constraint.
alter table public.orders
  drop constraint if exists orders_stock_deducted_status_consistent;

-- 2. Normalize all temporary existing orders before installing the new constraint.
UPDATE public.orders
SET stock_deducted = true
WHERE stock_deducted IS DISTINCT FROM TRUE;

-- 3. Require every order to record that submission stock was deducted.
alter table public.orders
  add constraint orders_stock_deducted_status_consistent
  check (stock_deducted IS TRUE);

-- Availability is controlled manually by the Admin. Stock quantity does not control availability.
alter table public.provider_products
  drop constraint if exists provider_products_zero_stock_unavailable;

-- MedSupply secure atomic order creation RPC with immediate stock deduction.
create or replace function public.create_order(order_items_input jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
AS $function$
declare
  v_caller uuid;
  v_profile public.profiles%rowtype;
  v_item jsonb;
  v_product_id_text text;
  v_quantity_text text;
  v_product_id uuid;
  v_quantity integer;
  v_rows_updated integer;
  v_duplicate_count integer;
  v_missing_product_id uuid;
  v_missing_product record;
  v_product record;
  v_store record;
  v_manufacturer record;
  v_group record;
  v_order_id uuid;
  v_group_id uuid;
  v_subtotal_before numeric(12,2);
  v_discount_amount numeric(12,2);
  v_total_amount numeric(12,2);
  v_total_quantity integer;
  v_line_count integer;
  v_requested_total_quantity bigint;
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  select * into v_profile
  from public.profiles
  where id = v_caller
  for share;

  if v_profile.id is null then
    raise exception 'Authenticated profile was not found.' using errcode = '42501';
  end if;

  if v_profile.role <> 'pharmacist'::public.user_role then
    raise exception 'Only pharmacists can create orders.' using errcode = '42501';
  end if;

  if v_profile.account_status is distinct from 'active'::public.pharmacist_account_status then
    raise exception 'An active pharmacist profile is required to create orders.' using errcode = '42501';
  end if;

  if pg_catalog.jsonb_typeof(order_items_input) is distinct from 'array' then
    raise exception 'order_items_input must be a JSON array.' using errcode = '22023';
  end if;

  if pg_catalog.jsonb_array_length(order_items_input) = 0 then
    raise exception 'At least one order item is required.' using errcode = '22023';
  end if;

  if pg_catalog.jsonb_array_length(order_items_input) > 50 then
    raise exception 'A maximum of 50 order items is allowed.' using errcode = '22023';
  end if;

  create temporary table pg_temp.requested_order_items (
    product_id uuid primary key,
    quantity integer not null
  ) on commit drop;

  create temporary table pg_temp.requested_store_ids (
    store_id uuid primary key
  ) on commit drop;

  create temporary table pg_temp.requested_manufacturer_ids (
    manufacturer_id uuid primary key
  ) on commit drop;

  create temporary table pg_temp.validated_order_items (
    product_id uuid primary key,
    quantity integer not null,
    provider_type public.order_provider_type not null,
    provider_id uuid not null,
    provider_name text not null,
    minimum_order_value numeric(12,2) not null,
    product_name text not null,
    dosage text,
    package_size text,
    variant text,
    specialty_name text,
    consumer_unit_price numeric(12,2) not null,
    discount_percentage numeric(5,2) not null,
    final_unit_price numeric(12,2) not null,
    line_subtotal_before_discount numeric(12,2) not null,
    line_subtotal_after_discount numeric(12,2) not null,
    provider_group_id uuid
  ) on commit drop;

  create temporary table pg_temp.provider_order_totals (
    provider_type public.order_provider_type not null,
    provider_id uuid not null,
    provider_name text not null,
    minimum_order_value numeric(12,2) not null,
    subtotal_before_discount numeric(12,2) not null,
    subtotal_after_discount numeric(12,2) not null,
    total_quantity integer not null,
    line_count integer not null,
    provider_group_id uuid,
    primary key (provider_type, provider_id)
  ) on commit drop;

  for v_item in
    select value
    from pg_catalog.jsonb_array_elements(order_items_input)
  loop
    if pg_catalog.jsonb_typeof(v_item) is distinct from 'object' then
      raise exception 'Each order item must be a JSON object.' using errcode = '22023';
    end if;

    if exists (
      select 1
      from pg_catalog.jsonb_object_keys(v_item) as keys(unknown_key)
      where unknown_key not in ('product_id', 'quantity')
    ) then
      raise exception 'Order items may contain only product_id and quantity.' using errcode = '22023';
    end if;

    if v_item ? 'product_id' is false or v_item ? 'quantity' is false then
      raise exception 'Each order item requires product_id and quantity.' using errcode = '22023';
    end if;

    v_product_id_text := v_item->>'product_id';
    v_quantity_text := v_item->>'quantity';

    if v_product_id_text is null or pg_catalog.btrim(v_product_id_text) = '' then
      raise exception 'A valid product_id is required.' using errcode = '22023';
    end if;

    begin
      v_product_id := v_product_id_text::uuid;
    exception
      when invalid_text_representation then
        raise exception 'A valid product UUID is required.' using errcode = '22023';
    end;

    if pg_catalog.jsonb_typeof(v_item->'quantity') is distinct from 'number'
       or v_quantity_text is null
       or v_quantity_text !~ '^[1-9][0-9]*$'
    then
      raise exception 'Quantity must be a positive integer.' using errcode = '22023';
    end if;

    begin
      v_quantity := v_quantity_text::integer;
    exception
      when numeric_value_out_of_range then
        raise exception 'Quantity is outside the supported range.' using errcode = '22023';
    end;

    if v_quantity <= 0 then
      raise exception 'Quantity must be a positive integer.' using errcode = '22023';
    end if;

    insert into pg_temp.requested_order_items (product_id, quantity)
    values (v_product_id, v_quantity)
    on conflict do nothing;

    get diagnostics v_duplicate_count = row_count;
    if v_duplicate_count = 0 then
      raise exception 'Duplicate product IDs are not allowed.' using errcode = '22023';
    end if;
  end loop;

  select r.product_id
  into v_missing_product_id
  from pg_temp.requested_order_items r
  left join public.provider_products p on p.id = r.product_id
  where p.id is null
  order by r.product_id
  limit 1;

  if v_missing_product_id is not null then
    raise exception 'Product % does not exist.', v_missing_product_id using errcode = 'P0002';
  end if;

  -- Lock product rows in deterministic UUID order, validate availability and stock,
  -- and immediately deduct stock. No availability column is updated.
  for v_product in
    select p.*
    from public.provider_products p
    join pg_temp.requested_order_items r on r.product_id = p.id
    order by p.id
    for update of p
  loop
    select r.quantity
    into v_quantity
    from pg_temp.requested_order_items r
    where r.product_id = v_product.id;

    if v_product.deleted_at is not null then
      raise exception 'Product % is no longer available.', v_product.name using errcode = 'P0002';
    end if;

    if v_product.is_available is distinct from true then
      raise exception 'Product % is unavailable.', v_product.name using errcode = 'P0001';
    end if;

    if v_product.stock_quantity < v_quantity then
      raise exception 'Insufficient stock for product %: requested %, available %.',
        v_product.name, v_quantity, v_product.stock_quantity using errcode = 'P0001';
    end if;

    if v_product.consumer_price is null
       or v_product.consumer_price <= 0
       or v_product.discount_percentage is null
       or v_product.discount_percentage < 0
       or v_product.discount_percentage > 100
       or v_product.pharmacist_price_after_discount is null
       or v_product.pharmacist_price_after_discount < 0
    then
      raise exception 'Product % has invalid pricing or discount data.', v_product.name using errcode = 'P0001';
    end if;

    if v_product.store_id is not null and v_product.manufacturer_id is null then
      insert into pg_temp.requested_store_ids (store_id)
      values (v_product.store_id)
      on conflict do nothing;
    elsif v_product.store_id is null and v_product.manufacturer_id is not null then
      insert into pg_temp.requested_manufacturer_ids (manufacturer_id)
      values (v_product.manufacturer_id)
      on conflict do nothing;
    else
      raise exception 'Product % has invalid provider ownership.', v_product.name using errcode = 'P0001';
    end if;

    update public.provider_products
    set stock_quantity = stock_quantity - v_quantity
    where id = v_product.id
      and stock_quantity >= v_quantity;

    get diagnostics v_rows_updated = row_count;
    if v_rows_updated <> 1 then
      raise exception 'Insufficient stock for product %: requested %, available %.',
        v_product.name, v_quantity, v_product.stock_quantity using errcode = 'P0001';
    end if;
  end loop;

  -- Lock Store rows in deterministic ID order and validate active/not-deleted providers.
  for v_store in
    select s.*
    from public.stores s
    join pg_temp.requested_store_ids r on r.store_id = s.id
    order by s.id
    for update of s
  loop
    if v_store.deleted_at is not null or v_store.status <> 'active'::public.provider_status then
      raise exception 'Store % is inactive or unavailable.', v_store.name using errcode = 'P0001';
    end if;

    if v_store.minimum_order_value is null or v_store.minimum_order_value < 0 then
      raise exception 'Store % has an invalid minimum order value.', v_store.name using errcode = 'P0001';
    end if;
  end loop;

  select r.store_id
  into v_missing_product_id
  from pg_temp.requested_store_ids r
  left join public.stores s on s.id = r.store_id
  where s.id is null
  order by r.store_id
  limit 1;

  if v_missing_product_id is not null then
    raise exception 'The Store provider for this order no longer exists.' using errcode = 'P0002';
  end if;

  -- Lock Manufacturer rows in deterministic ID order and validate active/not-deleted providers.
  for v_manufacturer in
    select m.*
    from public.manufacturers m
    join pg_temp.requested_manufacturer_ids r on r.manufacturer_id = m.id
    order by m.id
    for update of m
  loop
    if v_manufacturer.deleted_at is not null or v_manufacturer.status <> 'active'::public.provider_status then
      raise exception 'Manufacturer % is inactive or unavailable.', v_manufacturer.name using errcode = 'P0001';
    end if;

    if v_manufacturer.minimum_order_value is null or v_manufacturer.minimum_order_value < 0 then
      raise exception 'Manufacturer % has an invalid minimum order value.', v_manufacturer.name using errcode = 'P0001';
    end if;
  end loop;

  select r.manufacturer_id
  into v_missing_product_id
  from pg_temp.requested_manufacturer_ids r
  left join public.manufacturers m on m.id = r.manufacturer_id
  where m.id is null
  order by r.manufacturer_id
  limit 1;

  if v_missing_product_id is not null then
    raise exception 'The Manufacturer provider for this order no longer exists.' using errcode = 'P0002';
  end if;

  insert into pg_temp.validated_order_items (
    product_id,
    quantity,
    provider_type,
    provider_id,
    provider_name,
    minimum_order_value,
    product_name,
    dosage,
    package_size,
    variant,
    specialty_name,
    consumer_unit_price,
    discount_percentage,
    final_unit_price,
    line_subtotal_before_discount,
    line_subtotal_after_discount
  )
  select
    p.id,
    r.quantity,
    case when p.store_id is not null then 'store'::public.order_provider_type else 'manufacturer'::public.order_provider_type end,
    coalesce(p.store_id, p.manufacturer_id),
    coalesce(s.name, m.name),
    coalesce(s.minimum_order_value, m.minimum_order_value, 0),
    p.name,
    p.dosage,
    p.package_size,
    p.variant,
    sp.name,
    p.consumer_price,
    p.discount_percentage,
    pg_catalog.round(p.pharmacist_price_after_discount, 2),
    pg_catalog.round(pg_catalog.round(p.consumer_price, 2) * r.quantity, 2),
    pg_catalog.round(pg_catalog.round(p.pharmacist_price_after_discount, 2) * r.quantity, 2)
  from pg_temp.requested_order_items r
  join public.provider_products p on p.id = r.product_id
  left join public.stores s on s.id = p.store_id
  left join public.manufacturers m on m.id = p.manufacturer_id
  left join public.specialties sp on sp.id = p.specialty_id
  order by p.id;

  select COALESCE(pg_catalog.sum(quantity::bigint), 0::bigint)
  into v_requested_total_quantity
  from pg_temp.validated_order_items;

  if v_requested_total_quantity > 2147483647::bigint then
    raise exception 'Combined order quantity exceeds the supported integer limit.' using errcode = '22023';
  end if;

  insert into pg_temp.provider_order_totals (
    provider_type,
    provider_id,
    provider_name,
    minimum_order_value,
    subtotal_before_discount,
    subtotal_after_discount,
    total_quantity,
    line_count
  )
  select
    provider_type,
    provider_id,
    pg_catalog.min(provider_name),
    pg_catalog.min(minimum_order_value),
    pg_catalog.round(pg_catalog.sum(line_subtotal_before_discount), 2),
    pg_catalog.round(pg_catalog.sum(line_subtotal_after_discount), 2),
    pg_catalog.sum(quantity),
    pg_catalog.count(*)
  from pg_temp.validated_order_items
  group by provider_type, provider_id;

  for v_group in
    select *
    from pg_temp.provider_order_totals
    order by provider_type, provider_id
  loop
    if v_group.subtotal_after_discount < v_group.minimum_order_value then
      raise exception 'Minimum order not met for % %: required %, provider subtotal %.',
        case v_group.provider_type when 'store' then 'Store' else 'Manufacturer' end,
        v_group.provider_name,
        pg_catalog.round(v_group.minimum_order_value, 2),
        pg_catalog.round(v_group.subtotal_after_discount, 2)
        using errcode = 'P0001';
    end if;
  end loop;

  select
    pg_catalog.round(coalesce(pg_catalog.sum(line_subtotal_before_discount), 0), 2),
    pg_catalog.round(coalesce(pg_catalog.sum(line_subtotal_after_discount), 0), 2),
    pg_catalog.sum(quantity),
    pg_catalog.count(*)
  into v_subtotal_before, v_total_amount, v_total_quantity, v_line_count
  from pg_temp.validated_order_items;

  v_discount_amount := greatest(pg_catalog.round(v_subtotal_before - v_total_amount, 2), 0);

  insert into public.orders (
    pharmacist_id,
    status,
    total_quantity,
    line_count,
    subtotal_amount,
    discount_amount,
    total_amount,
    rejection_reason,
    stock_deducted,
    approved_at,
    rejected_at,
    completed_at
  )
  values (
    v_caller,
    'pending'::public.order_status,
    v_total_quantity,
    v_line_count,
    v_subtotal_before,
    v_discount_amount,
    v_total_amount,
    null,
    true,
    null,
    null,
    null
  )
  returning id into v_order_id;

  for v_group in
    select *
    from pg_temp.provider_order_totals
    order by provider_type, provider_id
  loop
    insert into public.order_provider_groups (
      order_id,
      provider_type,
      store_id,
      manufacturer_id,
      provider_name,
      minimum_order_value_snapshot,
      subtotal_before_discount_snapshot,
      subtotal_after_discount_snapshot,
      total_quantity,
      line_count
    )
    values (
      v_order_id,
      v_group.provider_type,
      case when v_group.provider_type = 'store' then v_group.provider_id else null end,
      case when v_group.provider_type = 'manufacturer' then v_group.provider_id else null end,
      v_group.provider_name,
      v_group.minimum_order_value,
      v_group.subtotal_before_discount,
      v_group.subtotal_after_discount,
      v_group.total_quantity,
      v_group.line_count
    )
    returning id into v_group_id;

    update pg_temp.validated_order_items
    set provider_group_id = v_group_id
    where provider_type = v_group.provider_type
      and provider_id = v_group.provider_id;
  end loop;

  insert into public.order_items (
    order_id,
    provider_group_id,
    product_id,
    product_name,
    dosage,
    package_size,
    variant,
    specialty_name,
    consumer_unit_price,
    discount_percentage,
    final_unit_price,
    quantity,
    line_subtotal_before_discount,
    line_subtotal_after_discount
  )
  select
    v_order_id,
    i.provider_group_id,
    i.product_id,
    i.product_name,
    i.dosage,
    i.package_size,
    i.variant,
    i.specialty_name,
    i.consumer_unit_price,
    i.discount_percentage,
    i.final_unit_price,
    i.quantity,
    i.line_subtotal_before_discount,
    i.line_subtotal_after_discount
  from pg_temp.validated_order_items i
  order by i.product_id;

  return pg_catalog.jsonb_build_object(
    'order_id', v_order_id,
    'total_quantity', v_total_quantity,
    'line_count', v_line_count,
    'subtotal_amount', v_subtotal_before,
    'discount_amount', v_discount_amount,
    'total_amount', v_total_amount,
    'status', 'pending'
  );
end;
$function$;

revoke execute on function public.create_order(jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb) to authenticated;

commit;
