create extension if not exists "pgcrypto";

create type public.app_role as enum ('admin', 'executive', 'physician', 'analyst');
create type public.plan_tier as enum ('growth', 'professional', 'enterprise');
create type public.alert_severity as enum ('low', 'medium', 'high', 'critical');
create type public.alert_status as enum ('new', 'acknowledged', 'resolved');
create type public.integration_status as enum ('healthy', 'delayed', 'warning');
create type public.export_status as enum ('ready', 'processing');
create type public.export_format as enum ('pdf', 'csv', 'xlsx');
create type public.risk_level as enum ('low', 'moderate', 'high');
create type public.trend_direction as enum ('up', 'down', 'stable');

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan_tier public.plan_tier not null default 'growth',
  payer_focus text not null
);

create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  facility_type text not null,
  city text not null,
  state text not null,
  bed_count integer not null default 0
);

create table if not exists public.profiles (
  id uuid primary key,
  full_name text not null,
  title text not null
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role public.app_role not null,
  default_facility_id uuid references public.facilities(id) on delete set null
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  unique (user_id, organization_id)
);

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  full_name text not null,
  npi text not null,
  specialty text not null
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  full_name text not null,
  date_of_birth date not null,
  gender text not null,
  primary_condition text not null,
  risk_level public.risk_level not null
);

create table if not exists public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  code text not null,
  description text not null
);

create table if not exists public.lab_results (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  test_name text not null,
  value_numeric numeric not null,
  abnormal_flag boolean not null default false,
  collected_at timestamptz not null default now()
);

create table if not exists public.clinical_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  metric_name text not null,
  current_value numeric not null,
  target_value numeric not null,
  unit text not null,
  trend_direction public.trend_direction not null
);

create table if not exists public.financial_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  metric_name text not null,
  current_display text not null,
  target_display text not null,
  note text not null
);

create table if not exists public.population_segments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  cohort_name text not null,
  member_count integer not null,
  completion_rate integer not null,
  risk_level public.risk_level not null
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  module_name text not null,
  title text not null,
  description text not null,
  severity public.alert_severity not null,
  status public.alert_status not null default 'new',
  owner_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_name text not null,
  category_name text not null,
  standard_name text not null,
  status public.integration_status not null,
  latency_minutes integer not null,
  last_sync_at timestamptz not null default now()
);

create table if not exists public.report_exports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  export_format public.export_format not null,
  status public.export_status not null default 'processing',
  storage_path text,
  created_at timestamptz not null default now()
);

create unique index if not exists organization_memberships_user_org_key
on public.organization_memberships (user_id, organization_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_org_id uuid;
  default_facility_id uuid;
begin
  insert into public.profiles (id, full_name, title)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    ),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'title', ''),
      'Healthcare Analyst'
    )
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    title = excluded.title;

  select id
  into default_org_id
  from public.organizations
  order by name
  limit 1;

  if default_org_id is not null then
    select id
    into default_facility_id
    from public.facilities
    where organization_id = default_org_id
    order by name
    limit 1;

    insert into public.organization_memberships (
      user_id,
      organization_id,
      role,
      default_facility_id
    )
    values (
      new.id,
      default_org_id,
      'analyst',
      default_facility_id
    )
    on conflict (user_id, organization_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

alter table public.organizations enable row level security;
alter table public.facilities enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.organization_members enable row level security;
alter table public.providers enable row level security;
alter table public.patients enable row level security;
alter table public.diagnoses enable row level security;
alter table public.lab_results enable row level security;
alter table public.clinical_metrics enable row level security;
alter table public.financial_metrics enable row level security;
alter table public.population_segments enable row level security;
alter table public.alerts enable row level security;
alter table public.integration_connections enable row level security;
alter table public.report_exports enable row level security;

drop policy if exists "profiles own record" on public.profiles;
create policy "profiles own record"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles own update" on public.profiles;
create policy "profiles own update"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "memberships own record" on public.organization_memberships;
create policy "memberships own record"
on public.organization_memberships
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "organization_members_select_own" on public.organization_members;
create policy "organization_members_select_own"
on public.organization_members
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "organizations by membership" on public.organizations;
create policy "organizations by membership"
on public.organizations
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = organizations.id
      and membership.user_id = auth.uid()
  )
);

drop policy if exists "facilities by membership" on public.facilities;
create policy "facilities by membership"
on public.facilities
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = facilities.organization_id
      and membership.user_id = auth.uid()
  )
);

drop policy if exists "providers by membership" on public.providers;
create policy "providers by membership"
on public.providers
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = providers.organization_id
      and membership.user_id = auth.uid()
  )
);

drop policy if exists "patients by membership" on public.patients;
create policy "patients by membership"
on public.patients
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = patients.organization_id
      and membership.user_id = auth.uid()
  )
);

drop policy if exists "diagnoses by patient org membership" on public.diagnoses;
create policy "diagnoses by patient org membership"
on public.diagnoses
for select
to authenticated
using (
  exists (
    select 1
    from public.patients patient
    join public.organization_memberships membership
      on membership.organization_id = patient.organization_id
    where patient.id = diagnoses.patient_id
      and membership.user_id = auth.uid()
  )
);

drop policy if exists "labs by patient org membership" on public.lab_results;
create policy "labs by patient org membership"
on public.lab_results
for select
to authenticated
using (
  exists (
    select 1
    from public.patients patient
    join public.organization_memberships membership
      on membership.organization_id = patient.organization_id
    where patient.id = lab_results.patient_id
      and membership.user_id = auth.uid()
  )
);

drop policy if exists "clinical metrics by membership" on public.clinical_metrics;
create policy "clinical metrics by membership"
on public.clinical_metrics
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = clinical_metrics.organization_id
      and membership.user_id = auth.uid()
  )
);

drop policy if exists "financial metrics by membership" on public.financial_metrics;
create policy "financial metrics by membership"
on public.financial_metrics
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = financial_metrics.organization_id
      and membership.user_id = auth.uid()
  )
);

drop policy if exists "population segments by membership" on public.population_segments;
create policy "population segments by membership"
on public.population_segments
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = population_segments.organization_id
      and membership.user_id = auth.uid()
  )
);

drop policy if exists "alerts by membership" on public.alerts;
create policy "alerts by membership"
on public.alerts
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = alerts.organization_id
      and membership.user_id = auth.uid()
  )
);

drop policy if exists "alerts insert by admin executive analyst" on public.alerts;
create policy "alerts insert by admin executive analyst"
on public.alerts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = alerts.organization_id
      and membership.user_id = auth.uid()
      and membership.role in ('admin', 'executive', 'analyst')
  )
);

drop policy if exists "integrations by membership" on public.integration_connections;
create policy "integrations by membership"
on public.integration_connections
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = integration_connections.organization_id
      and membership.user_id = auth.uid()
  )
);

drop policy if exists "report exports by membership" on public.report_exports;
create policy "report exports by membership"
on public.report_exports
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = report_exports.organization_id
      and membership.user_id = auth.uid()
  )
);

-- =====================================================================
-- HealthScope Analytics Suite v2: Multi-tenant + RBAC + Realtime schema
-- =====================================================================

alter table if exists public.organizations add column if not exists organization_id uuid;
alter table if exists public.organizations add column if not exists created_at timestamptz not null default now();
alter table if exists public.organizations add column if not exists updated_at timestamptz not null default now();
alter table if exists public.organizations add column if not exists deleted_at timestamptz;
update public.organizations set organization_id = id where organization_id is null;

alter table if exists public.facilities add column if not exists created_at timestamptz not null default now();
alter table if exists public.facilities add column if not exists updated_at timestamptz not null default now();
alter table if exists public.facilities add column if not exists deleted_at timestamptz;

alter table if exists public.organization_memberships add column if not exists created_at timestamptz not null default now();
alter table if exists public.organization_memberships add column if not exists updated_at timestamptz not null default now();
alter table if exists public.organization_memberships add column if not exists deleted_at timestamptz;

alter table if exists public.patients add column if not exists created_at timestamptz not null default now();
alter table if exists public.patients add column if not exists updated_at timestamptz not null default now();
alter table if exists public.patients add column if not exists deleted_at timestamptz;

alter table if exists public.providers add column if not exists created_at timestamptz not null default now();
alter table if exists public.providers add column if not exists updated_at timestamptz not null default now();
alter table if exists public.providers add column if not exists deleted_at timestamptz;

alter table if exists public.diagnoses add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table if exists public.diagnoses add column if not exists facility_id uuid references public.facilities(id) on delete set null;
alter table if exists public.diagnoses add column if not exists created_at timestamptz not null default now();
alter table if exists public.diagnoses add column if not exists updated_at timestamptz not null default now();
alter table if exists public.diagnoses add column if not exists deleted_at timestamptz;
update public.diagnoses d
set organization_id = p.organization_id,
    facility_id = p.facility_id
from public.patients p
where d.patient_id = p.id
  and (d.organization_id is null or d.facility_id is null);

alter table if exists public.lab_results add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
alter table if exists public.lab_results add column if not exists facility_id uuid references public.facilities(id) on delete set null;
alter table if exists public.lab_results add column if not exists created_at timestamptz not null default now();
alter table if exists public.lab_results add column if not exists updated_at timestamptz not null default now();
alter table if exists public.lab_results add column if not exists deleted_at timestamptz;
update public.lab_results l
set organization_id = p.organization_id,
    facility_id = p.facility_id
from public.patients p
where l.patient_id = p.id
  and (l.organization_id is null or l.facility_id is null);

alter table if exists public.alerts add column if not exists alert_type text not null default 'system';
alter table if exists public.alerts add column if not exists updated_at timestamptz not null default now();
alter table if exists public.alerts add column if not exists deleted_at timestamptz;

alter table if exists public.integration_connections add column if not exists connector_type text not null default 'custom';
alter table if exists public.integration_connections add column if not exists facility_id uuid references public.facilities(id) on delete set null;
alter table if exists public.integration_connections add column if not exists created_at timestamptz not null default now();
alter table if exists public.integration_connections add column if not exists updated_at timestamptz not null default now();
alter table if exists public.integration_connections add column if not exists deleted_at timestamptz;

alter table if exists public.report_exports add column if not exists report_id uuid;
alter table if exists public.report_exports add column if not exists template_id uuid;
alter table if exists public.report_exports add column if not exists requested_by_user_id uuid;
alter table if exists public.report_exports add column if not exists file_size_bytes bigint;
alter table if exists public.report_exports add column if not exists updated_at timestamptz not null default now();
alter table if exists public.report_exports add column if not exists deleted_at timestamptz;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  name text not null,
  slug text not null,
  description text,
  is_system boolean not null default false,
  unique (organization_id, slug)
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  code text not null,
  name text not null,
  description text,
  unique (organization_id, code)
);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  unique (organization_id, role_id, permission_id)
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  email text not null,
  full_name text not null,
  title text,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  last_login timestamptz,
  role_id uuid references public.roles(id) on delete set null,
  facility_id uuid references public.facilities(id) on delete set null,
  unique (organization_id, email)
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  unique (organization_id, user_id, role_id, facility_id)
);

create table if not exists public.organization_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  setting_key text not null,
  setting_value jsonb not null default '{}'::jsonb,
  scope text not null default 'organization' check (scope in ('organization', 'facility', 'dashboard')),
  facility_id uuid references public.facilities(id) on delete set null,
  role_id uuid references public.roles(id) on delete set null
);

create unique index if not exists organization_settings_key_scope_idx
on public.organization_settings (
  organization_id,
  setting_key,
  scope,
  coalesce(facility_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  user_id uuid not null references public.users(id) on delete cascade,
  session_token text not null,
  status text not null default 'active' check (status in ('active', 'expired', 'revoked')),
  role_id uuid references public.roles(id) on delete set null,
  facility_id uuid references public.facilities(id) on delete set null,
  ip_address text,
  user_agent text,
  last_seen_at timestamptz not null default now(),
  unique (session_token)
);

create table if not exists public.user_activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  user_id uuid not null references public.users(id) on delete cascade,
  activity_type text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text
);

create table if not exists public.user_facility_access (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  user_id uuid not null references public.users(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  role_id uuid references public.roles(id) on delete set null,
  is_primary boolean not null default false,
  status text not null default 'active' check (status in ('active', 'inactive')),
  unique (organization_id, user_id, facility_id)
);

create table if not exists public.active_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  user_id uuid not null references public.users(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete set null,
  role_id uuid references public.roles(id) on delete set null,
  dashboard_slug text,
  session_status text not null default 'active' check (session_status in ('active', 'idle', 'disconnected')),
  connected_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create unique index if not exists active_sessions_user_dashboard_idx
on public.active_sessions (user_id, coalesce(dashboard_slug, 'global'));

create table if not exists public.user_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  user_id uuid not null references public.users(id) on delete cascade,
  event_type text not null,
  event_name text not null,
  dashboard_slug text,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists public.dashboards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  facility_id uuid references public.facilities(id) on delete set null,
  role_id uuid references public.roles(id) on delete set null,
  role_slug text not null,
  name text not null,
  slug text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'draft', 'archived')),
  layout_config jsonb not null default '{}'::jsonb,
  unique (organization_id, slug)
);

create table if not exists public.widget_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  widget_key text not null,
  name text not null,
  category text not null,
  schema jsonb not null default '{}'::jsonb,
  is_system boolean not null default true,
  unique (organization_id, widget_key)
);

create table if not exists public.dashboard_widgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  dashboard_id uuid not null references public.dashboards(id) on delete cascade,
  widget_type_id uuid references public.widget_types(id) on delete set null,
  widget_key text not null,
  title text not null,
  position integer not null default 0,
  size text not null default 'md',
  is_visible boolean not null default true
);

create table if not exists public.widget_configurations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  dashboard_widget_id uuid not null references public.dashboard_widgets(id) on delete cascade,
  config jsonb not null default '{}'::jsonb,
  filters jsonb not null default '{}'::jsonb,
  datasource jsonb not null default '{}'::jsonb
);

create table if not exists public.dashboard_views (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  user_id uuid not null references public.users(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete set null,
  role_id uuid references public.roles(id) on delete set null,
  dashboard_id uuid references public.dashboards(id) on delete set null,
  dashboard_slug text,
  viewed_at timestamptz not null default now(),
  duration_seconds integer not null default 0
);

create table if not exists public.clinical_encounters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete set null,
  encounter_type text not null,
  encounter_date timestamptz not null,
  discharge_date timestamptz,
  outcome text,
  readmission_risk numeric(5,2)
);

create table if not exists public.procedures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete set null,
  cpt_code text not null,
  description text not null,
  performed_at timestamptz not null
);

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  medication_name text not null,
  dosage text not null,
  frequency text not null,
  start_date date not null,
  end_date date,
  prescribing_provider_id uuid references public.providers(id) on delete set null
);

create table if not exists public.vital_signs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  recorded_at timestamptz not null,
  heart_rate numeric,
  systolic_bp numeric,
  diastolic_bp numeric,
  respiratory_rate numeric,
  temperature_c numeric,
  oxygen_saturation numeric
);

create table if not exists public.insurance_claims (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  payer_name text not null,
  claim_number text not null,
  billed_amount numeric(14,2) not null,
  paid_amount numeric(14,2) not null default 0,
  denial_amount numeric(14,2) not null default 0,
  claim_status text not null,
  service_date date not null
);

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  transaction_type text not null,
  amount numeric(14,2) not null,
  transaction_date date not null,
  reference_type text,
  reference_id uuid,
  note text
);

create table if not exists public.quality_measures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  measure_code text not null,
  measure_name text not null,
  score numeric(8,2) not null,
  benchmark numeric(8,2),
  reporting_period text not null,
  status text not null default 'tracked'
);

create table if not exists public.alert_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  facility_id uuid references public.facilities(id) on delete set null,
  rule_name text not null,
  alert_type text not null,
  metric_name text not null,
  operator text not null,
  threshold numeric not null,
  severity public.alert_severity not null default 'medium',
  status text not null default 'active' check (status in ('active', 'inactive'))
);

create table if not exists public.alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  alert_rule_id uuid not null references public.alert_rules(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  channel text not null default 'in_app' check (channel in ('in_app', 'email', 'sms', 'webhook')),
  is_enabled boolean not null default true,
  unique (alert_rule_id, user_id, channel)
);

create table if not exists public.alert_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  alert_id uuid references public.alerts(id) on delete set null,
  alert_rule_id uuid references public.alert_rules(id) on delete set null,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  facility_id uuid references public.facilities(id) on delete set null,
  role_id uuid references public.roles(id) on delete set null,
  owner_user_id uuid references public.users(id) on delete set null,
  name text not null,
  category text not null,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  schedule_cron text,
  parameters jsonb not null default '{}'::jsonb
);

create table if not exists public.report_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  name text not null,
  template_type text not null,
  definition jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  status text not null default 'active'
);

create table if not exists public.data_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  facility_id uuid references public.facilities(id) on delete set null,
  source_name text not null,
  source_type text not null,
  endpoint text,
  auth_type text not null default 'token',
  status text not null default 'active'
);

create table if not exists public.integration_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  facility_id uuid references public.facilities(id) on delete set null,
  connection_id uuid references public.integration_connections(id) on delete set null,
  connector_type text not null,
  job_name text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  payload jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz
);

create table if not exists public.integration_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  facility_id uuid references public.facilities(id) on delete set null,
  connection_id uuid references public.integration_connections(id) on delete set null,
  job_id uuid references public.integration_jobs(id) on delete set null,
  log_level text not null default 'info' check (log_level in ('debug', 'info', 'warn', 'error')),
  message text not null,
  details jsonb not null default '{}'::jsonb,
  logged_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Keep profile/membership provisioning in sync with auth users
create or replace function public.sync_auth_user_to_app_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_org_id uuid;
  default_role_id uuid;
  default_facility_id uuid;
begin
  select id into default_org_id
  from public.organizations
  order by created_at asc
  limit 1;

  if default_org_id is null then
    return new;
  end if;

  select id into default_role_id
  from public.roles
  where organization_id = default_org_id
    and slug = 'analyst'
  order by created_at asc
  limit 1;

  select id into default_facility_id
  from public.facilities
  where organization_id = default_org_id
  order by created_at asc
  limit 1;

  insert into public.users (
    id,
    organization_id,
    email,
    full_name,
    title,
    status,
    last_login,
    role_id,
    facility_id
  )
  values (
    new.id,
    default_org_id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    ),
    coalesce(nullif(new.raw_user_meta_data ->> 'title', ''), 'Healthcare Analyst'),
    'active',
    now(),
    default_role_id,
    default_facility_id
  )
  on conflict (id) do update
  set
    organization_id = excluded.organization_id,
    email = excluded.email,
    full_name = excluded.full_name,
    title = excluded.title,
    status = excluded.status,
    role_id = excluded.role_id,
    facility_id = excluded.facility_id,
    updated_at = now();

  if default_role_id is not null then
    insert into public.user_roles (organization_id, user_id, role_id, facility_id, status)
    values (default_org_id, new.id, default_role_id, default_facility_id, 'active')
    on conflict (organization_id, user_id, role_id, facility_id) do nothing;
  end if;

  if default_facility_id is not null then
    insert into public.user_facility_access (organization_id, user_id, facility_id, role_id, is_primary, status)
    values (default_org_id, new.id, default_facility_id, default_role_id, true, 'active')
    on conflict (organization_id, user_id, facility_id) do nothing;
  end if;

  insert into public.user_activity_logs (
    organization_id,
    user_id,
    activity_type,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values (
    default_org_id,
    new.id,
    'auth.signup',
    'create_user',
    'user',
    new.id::text,
    jsonb_build_object('source', 'auth.users trigger')
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_sync on auth.users;
create trigger on_auth_user_created_sync
after insert on auth.users
for each row
execute procedure public.sync_auth_user_to_app_users();

create or replace function public.is_org_member(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = target_org_id
      and membership.user_id = auth.uid()
      and membership.deleted_at is null
  );
$$;

create or replace function public.is_org_admin(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = target_org_id
      and membership.user_id = auth.uid()
      and membership.role = 'admin'
      and membership.deleted_at is null
  );
$$;

do $$
declare
  table_name text;
begin
  -- Tables primarily managed by admins
  foreach table_name in array ARRAY[
    'roles',
    'permissions',
    'role_permissions',
    'user_roles',
    'organization_settings',
    'users',
    'user_sessions',
    'user_activity_logs',
    'user_facility_access',
    'dashboards',
    'dashboard_widgets',
    'widget_types',
    'widget_configurations',
    'clinical_encounters',
    'procedures',
    'medications',
    'vital_signs',
    'insurance_claims',
    'financial_transactions',
    'quality_measures',
    'alert_rules',
    'alert_subscriptions',
    'alert_events',
    'reports',
    'report_templates',
    'data_sources',
    'integration_jobs',
    'integration_logs'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);

    execute format('drop policy if exists "%s_member_select" on public.%I', table_name, table_name);
    execute format(
      'create policy "%s_member_select" on public.%I for select to authenticated using (public.is_org_member(organization_id) and deleted_at is null)',
      table_name,
      table_name
    );

    execute format('drop policy if exists "%s_admin_manage" on public.%I', table_name, table_name);
    execute format(
      'create policy "%s_admin_manage" on public.%I for all to authenticated using (public.is_org_admin(organization_id)) with check (public.is_org_admin(organization_id))',
      table_name,
      table_name
    );
  end loop;

  -- Event/session tables with member write permissions
  foreach table_name in array ARRAY['active_sessions', 'user_events', 'dashboard_views'] loop
    execute format('alter table public.%I enable row level security', table_name);

    execute format('drop policy if exists "%s_member_select" on public.%I', table_name, table_name);
    execute format(
      'create policy "%s_member_select" on public.%I for select to authenticated using (public.is_org_member(organization_id) and deleted_at is null)',
      table_name,
      table_name
    );

    execute format('drop policy if exists "%s_member_insert" on public.%I', table_name, table_name);
    execute format(
      'create policy "%s_member_insert" on public.%I for insert to authenticated with check (public.is_org_member(organization_id))',
      table_name,
      table_name
    );

    execute format('drop policy if exists "%s_member_update" on public.%I', table_name, table_name);
    execute format(
      'create policy "%s_member_update" on public.%I for update to authenticated using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id))',
      table_name,
      table_name
    );
  end loop;
end;
$$;

-- Users can update their own profile metadata and session status

drop policy if exists "users_self_update" on public.users;
create policy "users_self_update"
on public.users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Ensure update timestamps are refreshed automatically

do $$
declare
  table_name text;
begin
  foreach table_name in array ARRAY[
    'organizations',
    'facilities',
    'organization_memberships',
    'patients',
    'providers',
    'diagnoses',
    'lab_results',
    'alerts',
    'integration_connections',
    'report_exports',
    'roles',
    'permissions',
    'role_permissions',
    'users',
    'user_roles',
    'organization_settings',
    'user_sessions',
    'user_activity_logs',
    'user_facility_access',
    'active_sessions',
    'user_events',
    'dashboards',
    'widget_types',
    'dashboard_widgets',
    'widget_configurations',
    'dashboard_views',
    'clinical_encounters',
    'procedures',
    'medications',
    'vital_signs',
    'insurance_claims',
    'financial_transactions',
    'quality_measures',
    'alert_rules',
    'alert_subscriptions',
    'alert_events',
    'reports',
    'report_templates',
    'data_sources',
    'integration_jobs',
    'integration_logs'
  ] loop
    execute format('drop trigger if exists trg_%s_set_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger trg_%s_set_updated_at before update on public.%I for each row execute procedure public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end;
$$;

-- Realtime publication for activity tracking

do $$
begin
  begin
    alter publication supabase_realtime add table public.active_sessions;
  exception when duplicate_object then null; when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.user_events;
  exception when duplicate_object then null; when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.dashboard_views;
  exception when duplicate_object then null; when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.alerts;
  exception when duplicate_object then null; when undefined_object then null;
  end;
end;
$$;
