-- Healthcare org-assignment hardening
-- Ensures every auth user is attached to an organization and provides seed helpers.

begin;

create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------
-- Required tables/columns
-- -------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  created_at timestamptz not null default now()
);

alter table if exists public.organizations
  add column if not exists industry text;

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

alter table if exists public.organization_members
  add column if not exists created_at timestamptz not null default now();

alter table if exists public.organization_members
  add column if not exists role text not null default 'admin';

create unique index if not exists organization_members_user_org_key
  on public.organization_members (user_id, organization_id);

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

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  action text not null,
  resource_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table if exists public.activity_logs
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table if exists public.activity_logs
  add column if not exists created_at timestamptz not null default now();

create index if not exists idx_activity_logs_org_created
  on public.activity_logs (organization_id, created_at desc);

create index if not exists idx_activity_logs_user_created
  on public.activity_logs (user_id, created_at desc);

-- -------------------------------------------------------------------
-- Organization helper used by trigger + seed scripts
-- -------------------------------------------------------------------
create or replace function public.upsert_healthcare_organization(
  p_name text,
  p_industry text default 'Healthcare',
  p_slug text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_new_id uuid := gen_random_uuid();
  v_slug text;
  has_slug boolean;
  has_plan_tier boolean;
  has_payer_focus boolean;
  has_status boolean;
  has_metadata boolean;
  has_organization_id boolean;
  has_industry boolean;
  v_columns text[] := ARRAY['id', 'name'];
  v_values text[] := ARRAY[format('%L', v_new_id::text), format('%L', p_name)];
  v_sql text;
begin
  if nullif(trim(p_name), '') is null then
    raise exception 'Organization name is required';
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizations'
      and column_name = 'slug'
  ) into has_slug;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizations'
      and column_name = 'plan_tier'
  ) into has_plan_tier;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizations'
      and column_name = 'payer_focus'
  ) into has_payer_focus;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizations'
      and column_name = 'status'
  ) into has_status;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizations'
      and column_name = 'metadata'
  ) into has_metadata;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizations'
      and column_name = 'organization_id'
  ) into has_organization_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'organizations'
      and column_name = 'industry'
  ) into has_industry;

  if has_slug then
    v_slug := lower(regexp_replace(coalesce(nullif(trim(p_slug), ''), trim(p_name)), '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    if v_slug = '' then
      v_slug := 'healthcare-organization';
    end if;

    select id
    into v_org_id
    from public.organizations
    where slug = v_slug
    limit 1;
  end if;

  if v_org_id is null then
    select id
    into v_org_id
    from public.organizations
    where name = p_name
    limit 1;
  end if;

  if v_org_id is not null then
    if has_industry then
      update public.organizations
      set industry = coalesce(nullif(trim(p_industry), ''), industry)
      where id = v_org_id;
    end if;

    return v_org_id;
  end if;

  if has_organization_id then
    v_columns := array_append(v_columns, 'organization_id');
    v_values := array_append(v_values, format('%L', v_new_id::text));
  end if;

  if has_slug then
    v_columns := array_append(v_columns, 'slug');
    v_values := array_append(v_values, format('%L', v_slug));
  end if;

  if has_plan_tier then
    v_columns := array_append(v_columns, 'plan_tier');
    v_values := array_append(v_values, format('%L', 'growth'));
  end if;

  if has_payer_focus then
    v_columns := array_append(v_columns, 'payer_focus');
    v_values := array_append(v_values, format('%L', 'Commercial'));
  end if;

  if has_status then
    v_columns := array_append(v_columns, 'status');
    v_values := array_append(v_values, format('%L', 'active'));
  end if;

  if has_metadata then
    v_columns := array_append(v_columns, 'metadata');
    v_values := array_append(v_values, '''{}''::jsonb');
  end if;

  if has_industry then
    v_columns := array_append(v_columns, 'industry');
    v_values := array_append(v_values, format('%L', coalesce(nullif(trim(p_industry), ''), 'Healthcare')));
  end if;

  v_sql := format(
    'insert into public.organizations (%s) values (%s) returning id',
    array_to_string(v_columns, ', '),
    array_to_string(v_values, ', ')
  );

  execute v_sql into v_org_id;

  return v_org_id;
exception
  when unique_violation then
    if has_slug then
      select id into v_org_id from public.organizations where slug = v_slug limit 1;
    end if;

    if v_org_id is null then
      select id into v_org_id from public.organizations where name = p_name limit 1;
    end if;

    return v_org_id;
end;
$$;

grant execute on function public.upsert_healthcare_organization(text, text, text)
  to authenticated, service_role;

-- -------------------------------------------------------------------
-- Assignment helper + trigger
-- -------------------------------------------------------------------
create or replace function public.ensure_user_has_organization(
  p_user_id uuid,
  p_email text default null,
  p_user_meta jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_org_name text;
  v_org_slug text;
  v_industry text;
  v_fallback_role text := 'admin';
begin
  select organization_id
  into v_org_id
  from public.organization_members
  where user_id = p_user_id
  limit 1;

  if v_org_id is not null then
    return v_org_id;
  end if;

  -- Compatibility fallback for projects that still use organization_memberships.
  if to_regclass('public.organization_memberships') is not null then
    begin
      execute $legacy$
        select organization_id
        from public.organization_memberships
        where user_id = $1
        order by created_at asc nulls last
        limit 1
      $legacy$
      into v_org_id
      using p_user_id;

      if v_org_id is not null then
        insert into public.organization_members (user_id, organization_id, role)
        values (p_user_id, v_org_id, 'admin')
        on conflict (user_id, organization_id)
        do update set role = excluded.role;

        return v_org_id;
      end if;
    exception when others then
      null;
    end;
  end if;

  v_org_name := coalesce(
    nullif(trim(p_user_meta ->> 'organization_name'), ''),
    nullif(trim(p_user_meta ->> 'full_name'), '') || ' Practice',
    split_part(coalesce(p_email, 'healthscope-user@example.com'), '@', 1) || ' Health'
  );

  v_org_slug := nullif(trim(p_user_meta ->> 'organization_slug'), '');
  v_industry := coalesce(nullif(trim(p_user_meta ->> 'industry'), ''), 'Healthcare');

  v_org_id := public.upsert_healthcare_organization(v_org_name, v_industry, v_org_slug);

  insert into public.organization_members (user_id, organization_id, role)
  values (p_user_id, v_org_id, 'admin')
  on conflict (user_id, organization_id)
  do update set role = excluded.role;

  if to_regclass('public.organization_memberships') is not null then
    begin
      execute $legacy_insert$
        insert into public.organization_memberships (user_id, organization_id, role)
        values ($1, $2, $3)
        on conflict (user_id, organization_id)
        do update set role = excluded.role
      $legacy_insert$
      using p_user_id, v_org_id, v_fallback_role;
    exception when others then
      null;
    end;
  end if;

  return v_org_id;
end;
$$;

grant execute on function public.ensure_user_has_organization(uuid, text, jsonb)
  to authenticated, service_role;

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

-- -------------------------------------------------------------------
-- Safe backfill for existing users without organization assignments
-- -------------------------------------------------------------------
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

-- -------------------------------------------------------------------
-- Baseline healthcare organizations used by local seed scripts
-- -------------------------------------------------------------------
select public.upsert_healthcare_organization('Evergreen Medical Center', 'Healthcare', 'evergreen-medical-center');
select public.upsert_healthcare_organization('Sunrise Health System', 'Healthcare', 'sunrise-health-system');
select public.upsert_healthcare_organization('River Valley Hospital', 'Healthcare', 'river-valley-hospital');
select public.upsert_healthcare_organization('Harmony Care Network', 'Healthcare', 'harmony-care-network');
select public.upsert_healthcare_organization('BlueCross Community Clinic', 'Healthcare', 'bluecross-community-clinic');

commit;
