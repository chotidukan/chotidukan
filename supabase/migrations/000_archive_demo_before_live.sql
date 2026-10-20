-- Use ONLY when this Supabase project contains the earlier ChotiDukan demo.
-- This preserves conflicting demo tables in a private backup schema, then frees
-- their public names for 001_marketplace.sql. It does not delete table rows,
-- auth.users, public.profiles, Storage objects, or the product-images bucket.
-- Run once. The deliberate exception on a second run protects the first backup.

begin;

do $$
declare
  v_name text;
  v_kind "char";
  v_functions text[] := array[
    'owns_store','km_distance','india_today','owner_subscription_demand',
    'save_product','receive_stock','adjust_batch','_create_order','place_order',
    '_release_order','expire_unpaid_orders','attach_payment_order','confirm_payment',
    'record_refund','progress_delivery','next_subscription_at','save_subscription',
    'set_subscription_status','run_subscriptions','record_demand','cancel_cod_delivery'
  ];
  v_tables text[] := array[
    'marketplace_settings','stores','products','product_costs','inventory_batches',
    'orders','store_orders','order_items','order_item_costs','stock_movements',
    'demand_events','subscriptions','subscription_runs','payment_events','audit_log'
  ];
  v_proc record;
begin
  if exists(select 1 from pg_namespace where nspname='chotidukan_demo_backup') then
    raise exception 'chotidukan_demo_backup already exists. This archival script must not be run twice.';
  end if;

  create schema chotidukan_demo_backup;
  revoke all on schema chotidukan_demo_backup from public, anon, authenticated;

  foreach v_name in array v_tables loop
    select c.relkind into v_kind
      from pg_class c join pg_namespace n on n.oid=c.relnamespace
     where n.nspname='public' and c.relname=v_name;
    if v_kind in ('r','p') then
      execute format('alter table public.%I set schema chotidukan_demo_backup',v_name);
    elsif v_kind is not null then
      raise exception 'public.% exists but is not a table; archive it manually before installing',v_name;
    end if;
    v_kind := null;
  end loop;

  -- Demo routines use the same API names as live routines. Remove the routines,
  -- while retaining their underlying demo table data in the backup schema.
  for v_proc in
    select p.oid::regprocedure as signature
      from pg_proc p join pg_namespace n on n.oid=p.pronamespace
     where n.nspname='public' and p.proname=any(v_functions)
  loop
    execute format('drop function %s cascade',v_proc.signature);
  end loop;
end$$;

-- Policy names are schema-wide for storage.objects and would block 002_images.sql.
drop policy if exists product_images_read on storage.objects;
drop policy if exists product_images_upload on storage.objects;
drop policy if exists product_images_delete on storage.objects;

commit;

-- Expected result: zero rows. If any rows appear, stop before 001_marketplace.sql.
select schemaname,tablename
from pg_tables
where schemaname='public'
  and tablename=any(array[
    'chotidukan_profiles','marketplace_settings','stores','products','product_costs',
    'inventory_batches','orders','store_orders','order_items','order_item_costs',
    'stock_movements','demand_events','subscriptions','subscription_runs',
    'payment_events','audit_log'
  ])
order by tablename;
