-- ChotiDukan installation preflight (read-only).
-- Run this first in the Supabase SQL Editor. It changes nothing.
select
  to_regclass('public.chotidukan_profiles') as chotidukan_profiles,
  to_regclass('public.stores') as stores,
  to_regclass('public.products') as products,
  to_regclass('public.orders') as orders,
  case
    when to_regclass('public.chotidukan_profiles') is null
     and to_regclass('public.stores') is null
     and to_regclass('public.products') is null
     and to_regclass('public.orders') is null
      then 'READY: run 001_marketplace.sql, then 002_images.sql'
    when to_regclass('public.chotidukan_profiles') is not null
     and to_regclass('public.stores') is not null
     and to_regclass('public.products') is not null
     and to_regclass('public.orders') is not null
      then 'CHOTIDUKAN TABLES EXIST: do not rerun 001; verify the installation instead'
    else 'PARTIAL OR COLLIDING SCHEMA: do not run destructive cleanup; inspect the listed tables'
  end as installation_status;
