-- Run once in the Supabase SQL Editor. No service-role key is needed by the app.
begin;
create table if not exists public.demo_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  revision integer not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);
alter table public.demo_workspaces enable row level security;
revoke all on public.demo_workspaces from anon;
grant select, insert, update on public.demo_workspaces to authenticated;
drop policy if exists "Read own demo" on public.demo_workspaces;
create policy "Read own demo" on public.demo_workspaces for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Create own demo" on public.demo_workspaces;
create policy "Create own demo" on public.demo_workspaces for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Update own demo" on public.demo_workspaces;
create policy "Update own demo" on public.demo_workspaces for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
commit;
