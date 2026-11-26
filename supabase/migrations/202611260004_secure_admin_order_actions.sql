-- MedSupply Migration 2: secure Admin order actions.
-- Scope: approve_order, reject_order, complete_order.
-- Prepared for review only. Do not execute until approved.

begin;

create or replace function public.approve_order(target_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_caller uuid;
  v_order public.orders%rowtype;
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if not public.is_profile_admin() then
    raise exception 'Only administrators can approve orders.' using errcode = '42501';
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
    raise exception 'Only pending orders can be approved.' using errcode = 'P0001';
  end if;

  update public.orders
  set
    status = 'approved'::public.order_status,
    approved_at = pg_catalog.now(),
    rejection_reason = null,
    rejected_at = null,
    completed_at = null
  where id = target_order_id;

  return pg_catalog.jsonb_build_object(
    'order_id', target_order_id,
    'status', 'approved'
  );
end;
$function$;

revoke execute on function public.approve_order(uuid) from public, anon, authenticated;
grant execute on function public.approve_order(uuid) to authenticated;

create or replace function public.reject_order(target_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_caller uuid;
  v_order public.orders%rowtype;
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

  update public.orders
  set
    status = 'rejected'::public.order_status,
    rejection_reason = v_rejection_reason,
    rejected_at = pg_catalog.now(),
    approved_at = null,
    completed_at = null
  where id = target_order_id;

  return pg_catalog.jsonb_build_object(
    'order_id', target_order_id,
    'status', 'rejected'
  );
end;
$function$;

revoke execute on function public.reject_order(uuid) from public, anon, authenticated;
grant execute on function public.reject_order(uuid) to authenticated;

create or replace function public.complete_order(target_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_caller uuid;
  v_order public.orders%rowtype;
begin
  v_caller := auth.uid();
  if v_caller is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if not public.is_profile_admin() then
    raise exception 'Only administrators can complete orders.' using errcode = '42501';
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

  if v_order.status <> 'approved'::public.order_status then
    raise exception 'Only approved orders can be completed.' using errcode = 'P0001';
  end if;

  update public.orders
  set
    status = 'completed'::public.order_status,
    completed_at = pg_catalog.now(),
    rejection_reason = null
  where id = target_order_id;

  return pg_catalog.jsonb_build_object(
    'order_id', target_order_id,
    'status', 'completed'
  );
end;
$function$;

revoke execute on function public.complete_order(uuid) from public, anon, authenticated;
grant execute on function public.complete_order(uuid) to authenticated;

commit;
