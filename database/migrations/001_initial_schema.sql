-- HealthScope Analytics Suite
-- Complete Supabase/PostgreSQL schema for multi-tenant healthcare analytics SaaS

create extension if not exists "pgcrypto";

-- =====================================================================
-- Shared trigger for updated_at
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- 1) Multi-tenant foundation
-- =====================================================================
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique,
  name text not null,
  slug text not null unique,
  plan_tier text not null default 'growth' check (plan_tier in ('growth', 'professional', 'enterprise')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint organizations_self_tenant_check check (organization_id = id)
);

create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_code text not null,
  name text not null,
  facility_type text not null,
  city text not null,
  state text not null,
  country text not null default 'USA',
  bed_count integer not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, facility_code)
);

create table if not exists public.organization_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  setting_key text not null,
  setting_value jsonb not null default '{}'::jsonb,
  scope text not null default 'organization' check (scope in ('organization', 'facility', 'dashboard')),
  facility_id uuid references public.facilities(id) on delete set null,
  role_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, setting_key, scope, facility_id)
);

-- =====================================================================
-- 2) RBAC + identity
-- =====================================================================
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role_name text not null,
  role_slug text not null,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, role_slug)
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  permission_key text not null,
  permission_name text not null,
  description text,
  category text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, permission_key)
);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, role_id, permission_id)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'organization_settings_role_id_fkey'
  ) then
    alter table public.organization_settings
      add constraint organization_settings_role_id_fkey
      foreign key (role_id) references public.roles(id) on delete set null;
  end if;
end;
$$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text not null,
  full_name text not null,
  phone text,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  role_id uuid references public.roles(id) on delete set null,
  facility_id uuid references public.facilities(id) on delete set null,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, email)
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete set null,
  is_primary boolean not null default false,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, user_id, role_id, facility_id)
);

create table if not exists public.user_activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  activity_type text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address inet,
  user_agent text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.active_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role_id uuid references public.roles(id) on delete set null,
  facility_id uuid references public.facilities(id) on delete set null,
  session_token text not null,
  login_time timestamptz not null default now(),
  last_activity timestamptz not null default now(),
  current_page text,
  session_status text not null default 'active' check (session_status in ('active', 'idle', 'disconnected', 'expired')),
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (session_token)
);

-- =====================================================================
-- 4) Healthcare clinical data
-- =====================================================================
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  mrn text not null,
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  sex text not null check (sex in ('female', 'male', 'other', 'unknown')),
  primary_condition text,
  risk_level text not null default 'moderate' check (risk_level in ('low', 'moderate', 'high')),
  status text not null default 'active' check (status in ('active', 'inactive', 'deceased')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, mrn)
);

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  npi text not null,
  full_name text not null,
  specialty text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, npi)
);

create table if not exists public.clinical_encounters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  encounter_number text not null,
  patient_id uuid not null references public.patients(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete set null,
  encounter_type text not null,
  encounter_date timestamptz not null,
  discharge_date timestamptz,
  status text not null default 'completed' check (status in ('planned', 'in_progress', 'completed', 'cancelled')),
  readmission_risk numeric(5,2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, encounter_number)
);

create table if not exists public.diagnoses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.clinical_encounters(id) on delete cascade,
  icd10_code text not null,
  diagnosis_name text not null,
  diagnosis_type text not null default 'primary' check (diagnosis_type in ('primary', 'secondary', 'admitting')),
  diagnosed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.procedures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.clinical_encounters(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete set null,
  cpt_code text not null,
  procedure_name text not null,
  performed_at timestamptz not null,
  status text not null default 'completed' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.clinical_encounters(id) on delete set null,
  medication_name text not null,
  dosage text not null,
  frequency text not null,
  route text,
  start_date date not null,
  end_date date,
  status text not null default 'active' check (status in ('active', 'stopped', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.lab_results (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.clinical_encounters(id) on delete set null,
  test_name text not null,
  test_code text,
  result_value numeric,
  result_unit text,
  reference_range text,
  abnormal_flag boolean not null default false,
  collected_at timestamptz not null,
  reported_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.vital_signs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.clinical_encounters(id) on delete set null,
  recorded_at timestamptz not null,
  heart_rate numeric,
  systolic_bp numeric,
  diastolic_bp numeric,
  respiratory_rate numeric,
  temperature_c numeric,
  oxygen_saturation numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- =====================================================================
-- 5) Financial analytics
-- =====================================================================
create table if not exists public.insurance_claims (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.clinical_encounters(id) on delete set null,
  claim_number text not null,
  payer_name text not null,
  billed_amount numeric(14,2) not null,
  paid_amount numeric(14,2) not null default 0,
  denied_amount numeric(14,2) not null default 0,
  claim_status text not null check (claim_status in ('submitted', 'adjudicated', 'paid', 'denied', 'pending')),
  service_date date not null,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, claim_number)
);

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid not null references public.facilities(id) on delete cascade,
  claim_id uuid references public.insurance_claims(id) on delete set null,
  transaction_type text not null check (transaction_type in ('charge', 'payment', 'adjustment', 'refund', 'write_off')),
  amount numeric(14,2) not null,
  currency text not null default 'USD',
  transaction_date date not null,
  source_system text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.revenue_metrics (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete set null,
  metric_name text not null,
  period_start date not null,
  period_end date not null,
  gross_revenue numeric(14,2) not null default 0,
  net_revenue numeric(14,2) not null default 0,
  operating_margin numeric(8,2),
  denial_rate numeric(8,2),
  days_in_ar numeric(8,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, facility_id, metric_name, period_start, period_end)
);

-- =====================================================================
-- 6) Dashboards & analytics
-- =====================================================================
create table if not exists public.widget_types (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  widget_key text not null,
  name text not null,
  category text not null,
  config_schema jsonb not null default '{}'::jsonb,
  is_system boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, widget_key)
);

create table if not exists public.dashboards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete set null,
  role_id uuid references public.roles(id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'draft', 'archived')),
  layout_config jsonb not null default '{}'::jsonb,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, slug)
);

create table if not exists public.dashboard_widgets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  dashboard_id uuid not null references public.dashboards(id) on delete cascade,
  widget_type_id uuid references public.widget_types(id) on delete set null,
  title text not null,
  widget_key text not null,
  position_x integer not null default 0,
  position_y integer not null default 0,
  width integer not null default 4,
  height integer not null default 3,
  config jsonb not null default '{}'::jsonb,
  filters jsonb not null default '{}'::jsonb,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.analytics_models (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  model_name text not null,
  model_type text not null,
  version text not null,
  status text not null default 'active' check (status in ('active', 'training', 'inactive')),
  training_window text,
  parameters jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  deployed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, model_name, version)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete set null,
  role_id uuid references public.roles(id) on delete set null,
  report_name text not null,
  report_type text not null,
  schedule_cron text,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  parameters jsonb not null default '{}'::jsonb,
  owner_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.report_exports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  report_id uuid references public.reports(id) on delete set null,
  requested_by_user_id uuid references public.users(id) on delete set null,
  export_format text not null check (export_format in ('pdf', 'csv', 'xlsx')),
  export_status text not null default 'processing' check (export_status in ('processing', 'ready', 'failed')),
  storage_provider text not null default 's3',
  storage_path text,
  file_size_bytes bigint,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- =====================================================================
-- 7) Alerts system
-- =====================================================================
create table if not exists public.alert_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete set null,
  rule_name text not null,
  alert_type text not null check (alert_type in ('clinical', 'financial', 'system')),
  metric_name text not null,
  operator text not null check (operator in ('>', '>=', '<', '<=', '=', '!=')),
  threshold numeric not null,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  is_active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete set null,
  rule_id uuid references public.alert_rules(id) on delete set null,
  alert_type text not null check (alert_type in ('clinical', 'financial', 'system')),
  title text not null,
  description text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'new' check (status in ('new', 'acknowledged', 'resolved', 'dismissed')),
  triggered_value numeric,
  threshold_value numeric,
  owner_user_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.alert_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  alert_id uuid not null references public.alerts(id) on delete cascade,
  event_type text not null check (event_type in ('triggered', 'notified', 'acknowledged', 'resolved', 'dismissed')),
  event_payload jsonb not null default '{}'::jsonb,
  event_time timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  alert_rule_id uuid not null references public.alert_rules(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  channel text not null check (channel in ('in_app', 'email', 'sms', 'webhook')),
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, alert_rule_id, user_id, channel)
);

-- =====================================================================
-- 8) Integration hub
-- =====================================================================
create table if not exists public.data_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete set null,
  source_name text not null,
  source_type text not null check (source_type in ('fhir', 'epic', 'cerner', 'hl7', 'custom')),
  endpoint text,
  auth_type text not null default 'token',
  status text not null default 'active' check (status in ('active', 'inactive')),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  data_source_id uuid references public.data_sources(id) on delete set null,
  connector_name text not null,
  connector_type text not null check (connector_type in ('fhir', 'epic', 'cerner', 'custom')),
  status text not null default 'healthy' check (status in ('healthy', 'warning', 'error', 'paused')),
  last_sync_at timestamptz,
  latency_ms integer,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.integration_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connection_id uuid references public.integration_connections(id) on delete set null,
  job_type text not null,
  status text not null check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  payload jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  duration_ms integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.integration_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  job_id uuid references public.integration_jobs(id) on delete set null,
  connection_id uuid references public.integration_connections(id) on delete set null,
  log_level text not null check (log_level in ('debug', 'info', 'warn', 'error')),
  message text not null,
  details jsonb not null default '{}'::jsonb,
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- =====================================================================
-- 9) Activity tracking
-- =====================================================================
create table if not exists public.dashboard_views (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  dashboard_id uuid references public.dashboards(id) on delete set null,
  facility_id uuid references public.facilities(id) on delete set null,
  viewed_at timestamptz not null default now(),
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.user_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  event_type text not null,
  event_name text not null,
  page text,
  payload jsonb not null default '{}'::jsonb,
  event_time timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- =====================================================================
-- Indexes
-- =====================================================================
create index if not exists idx_facilities_org on public.facilities(organization_id);
create index if not exists idx_users_org on public.users(organization_id);
create index if not exists idx_users_status on public.users(organization_id, status);
create index if not exists idx_user_roles_org on public.user_roles(organization_id);
create index if not exists idx_user_activity_logs_org_time on public.user_activity_logs(organization_id, occurred_at desc);
create index if not exists idx_active_sessions_org_status on public.active_sessions(organization_id, session_status, last_activity desc);

create index if not exists idx_patients_org on public.patients(organization_id);
create index if not exists idx_patients_facility on public.patients(facility_id);
create index if not exists idx_providers_org on public.providers(organization_id);
create index if not exists idx_encounters_org_date on public.clinical_encounters(organization_id, encounter_date desc);
create index if not exists idx_diagnoses_org on public.diagnoses(organization_id);
create index if not exists idx_procedures_org on public.procedures(organization_id);
create index if not exists idx_medications_org on public.medications(organization_id);
create index if not exists idx_lab_results_org_collected on public.lab_results(organization_id, collected_at desc);
create index if not exists idx_vital_signs_org_recorded on public.vital_signs(organization_id, recorded_at desc);

create index if not exists idx_claims_org_status on public.insurance_claims(organization_id, claim_status);
create index if not exists idx_financial_transactions_org_date on public.financial_transactions(organization_id, transaction_date desc);
create index if not exists idx_revenue_metrics_org_period on public.revenue_metrics(organization_id, period_start, period_end);

create index if not exists idx_dashboards_org on public.dashboards(organization_id);
create index if not exists idx_dashboard_widgets_dashboard on public.dashboard_widgets(dashboard_id);
create index if not exists idx_reports_org on public.reports(organization_id);
create index if not exists idx_report_exports_org_status on public.report_exports(organization_id, export_status);

create index if not exists idx_alerts_org_status on public.alerts(organization_id, status, severity);
create index if not exists idx_alert_rules_org on public.alert_rules(organization_id);
create index if not exists idx_alert_events_org_time on public.alert_events(organization_id, event_time desc);

create index if not exists idx_data_sources_org on public.data_sources(organization_id);
create index if not exists idx_integration_connections_org on public.integration_connections(organization_id);
create index if not exists idx_integration_jobs_org_status on public.integration_jobs(organization_id, status);
create index if not exists idx_integration_logs_org_time on public.integration_logs(organization_id, logged_at desc);

create index if not exists idx_dashboard_views_org_time on public.dashboard_views(organization_id, viewed_at desc);
create index if not exists idx_user_events_org_time on public.user_events(organization_id, event_time desc);
create index if not exists idx_audit_logs_org_time on public.audit_logs(organization_id, created_at desc);

-- =====================================================================
-- Trigger bindings for updated_at
-- =====================================================================
do $$
declare
  t text;
begin
  foreach t in array ARRAY[
    'organizations',
    'facilities',
    'organization_settings',
    'roles',
    'permissions',
    'role_permissions',
    'users',
    'user_roles',
    'user_activity_logs',
    'active_sessions',
    'patients',
    'providers',
    'clinical_encounters',
    'diagnoses',
    'procedures',
    'medications',
    'lab_results',
    'vital_signs',
    'insurance_claims',
    'financial_transactions',
    'revenue_metrics',
    'widget_types',
    'dashboards',
    'dashboard_widgets',
    'analytics_models',
    'reports',
    'report_exports',
    'alert_rules',
    'alerts',
    'alert_events',
    'alert_subscriptions',
    'data_sources',
    'integration_connections',
    'integration_jobs',
    'integration_logs',
    'dashboard_views',
    'user_events',
    'audit_logs'
  ] loop
    execute format('drop trigger if exists trg_%s_updated_at on public.%I', t, t);
    execute format('create trigger trg_%s_updated_at before update on public.%I for each row execute procedure public.set_updated_at()', t, t);
  end loop;
end;
$$;

-- =====================================================================
-- Supabase Realtime publication for monitoring tables
-- =====================================================================
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
