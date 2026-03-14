-- User organization bootstrap
-- Creates organization_members model, auto-assignment trigger, and backfill for existing users.

begin;

create extension if not exists "pgcrypto";

-- Minimal organizations shape requested by product requirements.
-- If organizations already exists, this is a no-op.
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table if exists public.organizations
  add column if not exists created_at timestamptz not null default now();

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

-- Shared helper for trigger + backfill
create or replace function public.ensure_user_has_organization(
  p_user_id uuid,
  p_email text,
  p_user_meta jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing_org_id uuid;
  v_org_id uuid;
  v_org_name text;
  v_org_slug text;
  has_slug boolean;
  has_plan_tier boolean;
  has_payer_focus boolean;
begin
  select om.organization_id
  into v_existing_org_id
  from public.organization_members om
  where om.user_id = p_user_id
  limit 1;

  if v_existing_org_id is not null then
    return v_existing_org_id;
  end if;

  v_org_name := coalesce(
    nullif(trim(p_user_meta ->> 'organization_name'), ''),
    split_part(coalesce(p_email, 'user@example.com'), '@', 1) || '''s Organization'
  );

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizations'
      and column_name = 'slug'
  )
  into has_slug;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizations'
      and column_name = 'plan_tier'
  )
  into has_plan_tier;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizations'
      and column_name = 'payer_focus'
  )
  into has_payer_focus;

  if has_slug then
    v_org_slug := lower(regexp_replace(v_org_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_org_slug := trim(both '-' from v_org_slug);
    if v_org_slug = '' then
      v_org_slug := 'organization';
    end if;
    v_org_slug := left(v_org_slug, 40) || '-' || left(replace(p_user_id::text, '-', ''), 8);
  end if;

  if has_slug and has_plan_tier and has_payer_focus then
    insert into public.organizations (name, slug, plan_tier, payer_focus)
    values (v_org_name, v_org_slug, 'growth', 'Commercial')
    returning id into v_org_id;
  elsif has_slug and has_plan_tier then
    insert into public.organizations (name, slug, plan_tier)
    values (v_org_name, v_org_slug, 'growth')
    returning id into v_org_id;
  elsif has_slug then
    insert into public.organizations (name, slug)
    values (v_org_name, v_org_slug)
    returning id into v_org_id;
  else
    insert into public.organizations (name)
    values (v_org_name)
    returning id into v_org_id;
  end if;

  insert into public.organization_members (user_id, organization_id, role)
  values (p_user_id, v_org_id, 'admin')
  on conflict (user_id, organization_id)
  do update set role = excluded.role;

  -- Optional compatibility for projects still using organization_memberships.
  if to_regclass('public.organization_memberships') is not null then
    begin
      insert into public.organization_memberships (user_id, organization_id, role)
      values (p_user_id, v_org_id, 'admin')
      on conflict (user_id, organization_id)
      do update set role = excluded.role;
    exception when others then
      null;
    end;
  end if;

  return v_org_id;
end;
$$;

create or replace function public.handle_auth_user_created_assign_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ensure_user_has_organization(new.id, new.email, new.raw_user_meta_data);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_assign_org on auth.users;
create trigger on_auth_user_created_assign_org
after insert on auth.users
for each row
execute procedure public.handle_auth_user_created_assign_org();

-- Backfill existing users that have no organization_members row.
insert into public.organization_members (user_id, organization_id, role)
select
  au.id,
  public.ensure_user_has_organization(au.id, au.email, au.raw_user_meta_data),
  'admin'
from auth.users au
where not exists (
  select 1
  from public.organization_members om
  where om.user_id = au.id
)
on conflict (user_id, organization_id) do update
set role = excluded.role;

commit;
