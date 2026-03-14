begin;

create extension if not exists "pgcrypto";

-- Core tenant-assignment table required by HealthScope SaaS architecture.
create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  unique (user_id, organization_id)
);

create index if not exists organization_members_user_id_idx
  on public.organization_members (user_id);

create index if not exists organization_members_org_id_idx
  on public.organization_members (organization_id);

alter table public.organization_members enable row level security;

drop policy if exists "organization_members_select_own" on public.organization_members;
create policy "organization_members_select_own"
on public.organization_members
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "organization_members_insert_own" on public.organization_members;
create policy "organization_members_insert_own"
on public.organization_members
for insert
to authenticated
with check (user_id = auth.uid());

commit;
