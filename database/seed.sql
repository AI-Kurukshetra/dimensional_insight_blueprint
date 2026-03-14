-- HealthScope Analytics Suite seed data
-- Generates deterministic, realistic synthetic data for local/dev/test usage.

begin;

create or replace function public.seed_uuid(seed text)
returns uuid
language sql
immutable
as $$
  select (
    substr(md5(seed), 1, 8) || '-' ||
    substr(md5(seed), 9, 4) || '-' ||
    substr(md5(seed), 13, 4) || '-' ||
    substr(md5(seed), 17, 4) || '-' ||
    substr(md5(seed), 21, 12)
  )::uuid;
$$;

-- ---------------------------------------------------------------------
-- Organizations: 5
-- ---------------------------------------------------------------------
insert into public.organizations (
  id,
  organization_id,
  name,
  slug,
  plan_tier,
  status,
  metadata
)
select
  public.seed_uuid('org-' || o.org_idx),
  public.seed_uuid('org-' || o.org_idx),
  'HealthScope Organization ' || o.org_idx,
  'healthscope-org-' || o.org_idx,
  case
    when o.org_idx in (1, 2) then 'enterprise'
    when o.org_idx in (3, 4) then 'professional'
    else 'growth'
  end,
  'active',
  jsonb_build_object('region', case when o.org_idx % 2 = 0 then 'east' else 'west' end)
from generate_series(1, 5) as o(org_idx)
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  plan_tier = excluded.plan_tier,
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = now();

create temporary table seed_orgs as
select
  org_idx,
  public.seed_uuid('org-' || org_idx) as organization_id
from generate_series(1, 5) as org_idx;

-- ---------------------------------------------------------------------
-- Facilities: 3 per organization (15 total)
-- ---------------------------------------------------------------------
insert into public.facilities (
  id,
  organization_id,
  facility_code,
  name,
  facility_type,
  city,
  state,
  country,
  bed_count,
  status
)
select
  public.seed_uuid('facility-' || o.org_idx || '-' || f.facility_idx),
  o.organization_id,
  'FAC-' || lpad(o.org_idx::text, 2, '0') || '-' || f.facility_idx,
  'HealthScope Facility ' || o.org_idx || '-' || f.facility_idx,
  case f.facility_idx when 1 then 'Hospital' when 2 then 'Clinic' else 'Specialty Center' end,
  (array['Seattle', 'San Francisco', 'Austin', 'Chicago', 'Boston'])[((o.org_idx - 1) % 5) + 1],
  (array['WA', 'CA', 'TX', 'IL', 'MA'])[((o.org_idx - 1) % 5) + 1],
  'USA',
  120 + (o.org_idx * 20) + (f.facility_idx * 10),
  'active'
from seed_orgs o
cross join generate_series(1, 3) as f(facility_idx)
on conflict (organization_id, facility_code) do update
set
  name = excluded.name,
  facility_type = excluded.facility_type,
  city = excluded.city,
  state = excluded.state,
  bed_count = excluded.bed_count,
  status = excluded.status,
  updated_at = now();

create temporary table seed_facilities as
select
  o.org_idx,
  f.facility_idx,
  public.seed_uuid('facility-' || o.org_idx || '-' || f.facility_idx) as facility_id,
  o.organization_id
from seed_orgs o
cross join generate_series(1, 3) as f(facility_idx);

-- ---------------------------------------------------------------------
-- RBAC roles + permissions
-- ---------------------------------------------------------------------
insert into public.roles (
  id,
  organization_id,
  role_name,
  role_slug,
  description,
  is_system
)
select
  public.seed_uuid('role-' || o.org_idx || '-' || r.role_slug),
  o.organization_id,
  r.role_name,
  r.role_slug,
  r.description,
  true
from seed_orgs o
cross join (
  values
    ('Admin', 'admin', 'Full administrative access to tenant management and platform controls'),
    ('Executive', 'executive', 'Access to executive dashboards and KPI analytics'),
    ('Physician', 'physician', 'Access to clinical intelligence and patient analytics'),
    ('Analyst', 'analyst', 'Access to data analytics, cohorts, and reporting tools')
) as r(role_name, role_slug, description)
on conflict (organization_id, role_slug) do update
set
  role_name = excluded.role_name,
  description = excluded.description,
  is_system = excluded.is_system,
  updated_at = now();

create temporary table seed_roles as
select
  o.org_idx,
  o.organization_id,
  r.role_slug,
  public.seed_uuid('role-' || o.org_idx || '-' || r.role_slug) as role_id
from seed_orgs o
cross join (values ('admin'), ('executive'), ('physician'), ('analyst')) as r(role_slug);

insert into public.permissions (
  id,
  organization_id,
  permission_key,
  permission_name,
  description,
  category
)
select
  public.seed_uuid('perm-' || o.org_idx || '-' || p.permission_key),
  o.organization_id,
  p.permission_key,
  p.permission_name,
  p.description,
  p.category
from seed_orgs o
cross join (
  values
    ('users.manage', 'Manage Users', 'Create and manage users', 'admin'),
    ('facilities.manage', 'Manage Facilities', 'Create and manage facilities', 'admin'),
    ('dashboards.configure', 'Configure Dashboards', 'Build and configure dashboards', 'admin'),
    ('integrations.manage', 'Manage Integrations', 'Manage EHR integrations', 'admin'),
    ('alerts.configure', 'Configure Alerts', 'Manage alert rules and channels', 'admin'),
    ('settings.manage', 'Manage Settings', 'Manage organization settings', 'admin'),
    ('dashboard.executive.view', 'View Executive Dashboard', 'Access executive dashboards', 'executive'),
    ('financial.analytics.view', 'View Financial Analytics', 'Access financial analytics', 'executive'),
    ('reports.view', 'View Reports', 'Access reports and exports', 'executive'),
    ('kpi.view', 'View KPI Metrics', 'Access KPI widgets', 'executive'),
    ('clinical.analytics.view', 'View Clinical Analytics', 'Access clinical dashboards', 'physician'),
    ('labs.view', 'View Lab Results', 'Access lab result streams', 'physician'),
    ('diagnoses.view', 'View Diagnoses', 'Access diagnoses tracking', 'physician'),
    ('patient.analytics.view', 'View Patient Analytics', 'Access patient outcome analytics', 'physician'),
    ('population.analytics.view', 'View Population Analytics', 'Access cohort and population insights', 'analyst'),
    ('cohorts.manage', 'Manage Cohorts', 'Create and manage cohorts', 'analyst'),
    ('reports.build', 'Build Reports', 'Build analytics reports', 'analyst'),
    ('predictive.analytics.view', 'View Predictive Analytics', 'Access predictive models', 'analyst')
) as p(permission_key, permission_name, description, category)
on conflict (organization_id, permission_key) do update
set
  permission_name = excluded.permission_name,
  description = excluded.description,
  category = excluded.category,
  updated_at = now();

create temporary table seed_permissions as
select
  o.org_idx,
  o.organization_id,
  p.permission_key,
  public.seed_uuid('perm-' || o.org_idx || '-' || p.permission_key) as permission_id,
  p.category
from seed_orgs o
cross join (
  values
    ('users.manage', 'admin'),
    ('facilities.manage', 'admin'),
    ('dashboards.configure', 'admin'),
    ('integrations.manage', 'admin'),
    ('alerts.configure', 'admin'),
    ('settings.manage', 'admin'),
    ('dashboard.executive.view', 'executive'),
    ('financial.analytics.view', 'executive'),
    ('reports.view', 'executive'),
    ('kpi.view', 'executive'),
    ('clinical.analytics.view', 'physician'),
    ('labs.view', 'physician'),
    ('diagnoses.view', 'physician'),
    ('patient.analytics.view', 'physician'),
    ('population.analytics.view', 'analyst'),
    ('cohorts.manage', 'analyst'),
    ('reports.build', 'analyst'),
    ('predictive.analytics.view', 'analyst')
) as p(permission_key, category);

insert into public.role_permissions (
  id,
  organization_id,
  role_id,
  permission_id
)
select
  public.seed_uuid('roleperm-' || sp.org_idx || '-' || sr.role_slug || '-' || sp.permission_key),
  sp.organization_id,
  sr.role_id,
  sp.permission_id
from seed_permissions sp
join seed_roles sr
  on sr.org_idx = sp.org_idx
 and (
    sr.role_slug = 'admin'
    or (sr.role_slug = 'executive' and sp.category = 'executive')
    or (sr.role_slug = 'physician' and sp.category = 'physician')
    or (sr.role_slug = 'analyst' and sp.category = 'analyst')
 )
on conflict (organization_id, role_id, permission_id) do nothing;

-- ---------------------------------------------------------------------
-- Users: 10 per organization (50 total)
-- ---------------------------------------------------------------------
insert into public.users (
  id,
  organization_id,
  email,
  full_name,
  phone,
  status,
  role_id,
  facility_id,
  last_login
)
select
  public.seed_uuid('user-' || o.org_idx || '-' || u.user_idx),
  o.organization_id,
  'user' || o.org_idx || '_' || u.user_idx || '@healthscope.ai',
  'User ' || o.org_idx || '-' || u.user_idx,
  '+1-555-01' || lpad((o.org_idx * 10 + u.user_idx)::text, 3, '0'),
  case when u.user_idx = 10 then 'inactive' else 'active' end,
  public.seed_uuid(
    'role-' || o.org_idx || '-' ||
    case
      when u.user_idx = 1 then 'admin'
      when u.user_idx = 2 then 'executive'
      when u.user_idx in (3, 4) then 'physician'
      else 'analyst'
    end
  ),
  public.seed_uuid('facility-' || o.org_idx || '-' || (((u.user_idx - 1) % 3) + 1)),
  now() - ((u.user_idx * o.org_idx) || ' days')::interval
from seed_orgs o
cross join generate_series(1, 10) as u(user_idx)
on conflict (organization_id, email) do update
set
  full_name = excluded.full_name,
  phone = excluded.phone,
  status = excluded.status,
  role_id = excluded.role_id,
  facility_id = excluded.facility_id,
  last_login = excluded.last_login,
  updated_at = now();

create temporary table seed_users as
select
  o.org_idx,
  o.organization_id,
  u.user_idx,
  public.seed_uuid('user-' || o.org_idx || '-' || u.user_idx) as user_id,
  public.seed_uuid('facility-' || o.org_idx || '-' || (((u.user_idx - 1) % 3) + 1)) as facility_id,
  case
    when u.user_idx = 1 then 'admin'
    when u.user_idx = 2 then 'executive'
    when u.user_idx in (3, 4) then 'physician'
    else 'analyst'
  end as role_slug
from seed_orgs o
cross join generate_series(1, 10) as u(user_idx);

insert into public.user_roles (
  id,
  organization_id,
  user_id,
  role_id,
  facility_id,
  is_primary,
  status
)
select
  public.seed_uuid('userrole-' || su.org_idx || '-' || su.user_idx || '-' || su.role_slug),
  su.organization_id,
  su.user_id,
  sr.role_id,
  su.facility_id,
  true,
  'active'
from seed_users su
join seed_roles sr
  on sr.org_idx = su.org_idx
 and sr.role_slug = su.role_slug
on conflict (organization_id, user_id, role_id, facility_id) do update
set
  is_primary = excluded.is_primary,
  status = excluded.status,
  updated_at = now();

-- organization settings
insert into public.organization_settings (
  id,
  organization_id,
  setting_key,
  setting_value,
  scope,
  facility_id,
  role_id
)
select
  public.seed_uuid('setting-' || o.org_idx || '-' || s.setting_key),
  o.organization_id,
  s.setting_key,
  s.setting_value,
  'organization',
  null,
  null
from seed_orgs o
cross join (
  values
    ('timezone', '"America/Los_Angeles"'::jsonb),
    ('currency', '"USD"'::jsonb),
    ('dashboard_refresh_seconds', '60'::jsonb),
    ('alerts_channels', '["in_app","email"]'::jsonb)
) as s(setting_key, setting_value)
on conflict (id) do update
set
  organization_id = excluded.organization_id,
  setting_key = excluded.setting_key,
  setting_value = excluded.setting_value,
  scope = excluded.scope,
  facility_id = excluded.facility_id,
  role_id = excluded.role_id,
  updated_at = now();

-- active sessions and activity logs
insert into public.active_sessions (
  id,
  organization_id,
  user_id,
  role_id,
  facility_id,
  session_token,
  login_time,
  last_activity,
  current_page,
  session_status,
  ip_address,
  user_agent
)
select
  public.seed_uuid('session-' || su.org_idx || '-' || su.user_idx),
  su.organization_id,
  su.user_id,
  sr.role_id,
  su.facility_id,
  'sess-' || md5(su.user_id::text),
  now() - ((su.user_idx % 7) || ' hours')::interval,
  now() - ((su.user_idx % 30) || ' minutes')::interval,
  case su.role_slug
    when 'admin' then '/dashboard/admin'
    when 'executive' then '/dashboard/executive'
    when 'physician' then '/dashboard/physician'
    else '/dashboard/analyst'
  end,
  case when su.user_idx <= 4 then 'active' else 'idle' end,
  ('10.10.' || su.org_idx || '.' || su.user_idx)::inet,
  'Mozilla/5.0 HealthScope'
from seed_users su
join seed_roles sr
  on sr.org_idx = su.org_idx
 and sr.role_slug = su.role_slug
where su.user_idx <= 6
on conflict (session_token) do update
set
  last_activity = excluded.last_activity,
  current_page = excluded.current_page,
  session_status = excluded.session_status,
  updated_at = now();

insert into public.user_activity_logs (
  id,
  organization_id,
  user_id,
  activity_type,
  action,
  entity_type,
  entity_id,
  metadata,
  ip_address,
  user_agent,
  occurred_at
)
select
  public.seed_uuid('activity-' || su.org_idx || '-' || su.user_idx || '-' || a.activity_idx),
  su.organization_id,
  su.user_id,
  case a.activity_idx
    when 1 then 'auth.login'
    when 2 then 'dashboard.view'
    else 'report.export'
  end,
  case a.activity_idx
    when 1 then 'login'
    when 2 then 'view'
    else 'export'
  end,
  case a.activity_idx
    when 1 then 'session'
    when 2 then 'dashboard'
    else 'report'
  end,
  su.user_id::text,
  jsonb_build_object('seq', a.activity_idx),
  ('10.10.' || su.org_idx || '.' || su.user_idx)::inet,
  'Mozilla/5.0 HealthScope',
  now() - ((su.user_idx * a.activity_idx) || ' hours')::interval
from seed_users su
cross join generate_series(1, 3) as a(activity_idx)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Providers: 20 per organization (100 total)
-- ---------------------------------------------------------------------
insert into public.providers (
  id,
  organization_id,
  facility_id,
  npi,
  full_name,
  specialty,
  status
)
select
  public.seed_uuid('provider-' || o.org_idx || '-' || p.provider_idx),
  o.organization_id,
  public.seed_uuid('facility-' || o.org_idx || '-' || (((p.provider_idx - 1) % 3) + 1)),
  lpad((1000000000 + (o.org_idx * 1000) + p.provider_idx)::text, 10, '0'),
  'Provider ' || o.org_idx || '-' || p.provider_idx,
  (array['Internal Medicine', 'Cardiology', 'Endocrinology', 'Pulmonology', 'Family Medicine'])[((p.provider_idx - 1) % 5) + 1],
  'active'
from seed_orgs o
cross join generate_series(1, 20) as p(provider_idx)
on conflict (organization_id, npi) do update
set
  full_name = excluded.full_name,
  specialty = excluded.specialty,
  status = excluded.status,
  updated_at = now();

create temporary table seed_providers as
select
  o.org_idx,
  o.organization_id,
  p.provider_idx,
  public.seed_uuid('provider-' || o.org_idx || '-' || p.provider_idx) as provider_id,
  public.seed_uuid('facility-' || o.org_idx || '-' || (((p.provider_idx - 1) % 3) + 1)) as facility_id
from seed_orgs o
cross join generate_series(1, 20) as p(provider_idx);

-- ---------------------------------------------------------------------
-- Patients: 200 per organization (1000 total)
-- ---------------------------------------------------------------------
insert into public.patients (
  id,
  organization_id,
  facility_id,
  mrn,
  first_name,
  last_name,
  date_of_birth,
  sex,
  primary_condition,
  risk_level,
  status
)
select
  public.seed_uuid('patient-' || o.org_idx || '-' || p.patient_idx),
  o.organization_id,
  public.seed_uuid('facility-' || o.org_idx || '-' || (((p.patient_idx - 1) % 3) + 1)),
  'MRN-' || o.org_idx || '-' || lpad(p.patient_idx::text, 4, '0'),
  (array['Olivia', 'Noah', 'Ava', 'Liam', 'Sophia', 'Mason', 'Emma', 'Ethan'])[((p.patient_idx - 1) % 8) + 1],
  (array['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'])[((p.patient_idx - 1) % 8) + 1],
  date '1945-01-01' + ((p.patient_idx * 37 + o.org_idx * 53) % 25000),
  case when p.patient_idx % 2 = 0 then 'female' else 'male' end,
  (array['Type 2 Diabetes', 'Congestive Heart Failure', 'COPD', 'Hypertension', 'Chronic Kidney Disease'])[((p.patient_idx - 1) % 5) + 1],
  case
    when p.patient_idx % 10 in (0, 1) then 'high'
    when p.patient_idx % 10 in (2, 3, 4) then 'moderate'
    else 'low'
  end,
  'active'
from seed_orgs o
cross join generate_series(1, 200) as p(patient_idx)
on conflict (organization_id, mrn) do update
set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  primary_condition = excluded.primary_condition,
  risk_level = excluded.risk_level,
  status = excluded.status,
  updated_at = now();

create temporary table seed_patients as
select
  o.org_idx,
  o.organization_id,
  p.patient_idx,
  public.seed_uuid('patient-' || o.org_idx || '-' || p.patient_idx) as patient_id,
  public.seed_uuid('facility-' || o.org_idx || '-' || (((p.patient_idx - 1) % 3) + 1)) as facility_id
from seed_orgs o
cross join generate_series(1, 200) as p(patient_idx);

-- ---------------------------------------------------------------------
-- Encounters: 1000 total
-- ---------------------------------------------------------------------
insert into public.clinical_encounters (
  id,
  organization_id,
  facility_id,
  encounter_number,
  patient_id,
  provider_id,
  encounter_type,
  encounter_date,
  discharge_date,
  status,
  readmission_risk,
  notes
)
select
  public.seed_uuid('encounter-' || e.encounter_idx),
  o.organization_id,
  sf.facility_id,
  'ENC-' || lpad(e.encounter_idx::text, 6, '0'),
  sp.patient_id,
  spr.provider_id,
  (array['inpatient', 'outpatient', 'emergency'])[((e.encounter_idx - 1) % 3) + 1],
  now() - ((e.encounter_idx % 365) || ' days')::interval,
  now() - (((e.encounter_idx % 365) - 1) || ' days')::interval,
  'completed',
  round(((e.encounter_idx % 100) / 100.0)::numeric, 2),
  'Clinical encounter note ' || e.encounter_idx
from generate_series(1, 1000) as e(encounter_idx)
join seed_orgs o
  on o.org_idx = ((e.encounter_idx - 1) % 5) + 1
join seed_patients sp
  on sp.org_idx = o.org_idx
 and sp.patient_idx = ((e.encounter_idx - 1) % 200) + 1
join seed_providers spr
  on spr.org_idx = o.org_idx
 and spr.provider_idx = ((e.encounter_idx - 1) % 20) + 1
join seed_facilities sf
  on sf.org_idx = o.org_idx
 and sf.facility_idx = ((e.encounter_idx - 1) % 3) + 1
on conflict (organization_id, encounter_number) do nothing;

create temporary table seed_encounters as
select
  e.encounter_idx,
  public.seed_uuid('encounter-' || e.encounter_idx) as encounter_id,
  ((e.encounter_idx - 1) % 5) + 1 as org_idx
from generate_series(1, 1000) as e(encounter_idx);

-- Diagnoses (1000), Procedures (1200), Medications (1500), Vital signs (2500)
insert into public.diagnoses (
  id,
  organization_id,
  facility_id,
  patient_id,
  encounter_id,
  icd10_code,
  diagnosis_name,
  diagnosis_type,
  diagnosed_at
)
select
  public.seed_uuid('diag-' || se.encounter_idx),
  so.organization_id,
  sp.facility_id,
  sp.patient_id,
  se.encounter_id,
  (array['E11.9', 'I50.9', 'J44.9', 'I10', 'N18.9'])[((se.encounter_idx - 1) % 5) + 1],
  (array['Type 2 diabetes mellitus', 'Heart failure', 'COPD', 'Essential hypertension', 'Chronic kidney disease'])[((se.encounter_idx - 1) % 5) + 1],
  'primary',
  now() - ((se.encounter_idx % 180) || ' days')::interval
from seed_encounters se
join seed_orgs so on so.org_idx = se.org_idx
join seed_patients sp
  on sp.org_idx = se.org_idx
 and sp.patient_idx = ((se.encounter_idx - 1) % 200) + 1
on conflict (id) do nothing;

insert into public.procedures (
  id,
  organization_id,
  facility_id,
  patient_id,
  encounter_id,
  provider_id,
  cpt_code,
  procedure_name,
  performed_at,
  status
)
select
  public.seed_uuid('proc-' || p.proc_idx),
  so.organization_id,
  sf.facility_id,
  sp.patient_id,
  se.encounter_id,
  spr.provider_id,
  (array['93000', '99213', '80053', '71046', '36415'])[((p.proc_idx - 1) % 5) + 1],
  (array['Electrocardiogram', 'Office visit', 'Comprehensive metabolic panel', 'Chest X-ray', 'Venipuncture'])[((p.proc_idx - 1) % 5) + 1],
  now() - ((p.proc_idx % 220) || ' days')::interval,
  'completed'
from generate_series(1, 1200) as p(proc_idx)
join seed_orgs so on so.org_idx = ((p.proc_idx - 1) % 5) + 1
join seed_encounters se on se.encounter_idx = ((p.proc_idx - 1) % 1000) + 1
join seed_patients sp
  on sp.org_idx = so.org_idx
 and sp.patient_idx = ((p.proc_idx - 1) % 200) + 1
join seed_providers spr
  on spr.org_idx = so.org_idx
 and spr.provider_idx = ((p.proc_idx - 1) % 20) + 1
join seed_facilities sf
  on sf.org_idx = so.org_idx
 and sf.facility_idx = ((p.proc_idx - 1) % 3) + 1
on conflict (id) do nothing;

insert into public.medications (
  id,
  organization_id,
  facility_id,
  patient_id,
  encounter_id,
  medication_name,
  dosage,
  frequency,
  route,
  start_date,
  end_date,
  status
)
select
  public.seed_uuid('med-' || m.med_idx),
  so.organization_id,
  sf.facility_id,
  sp.patient_id,
  se.encounter_id,
  (array['Metformin', 'Lisinopril', 'Atorvastatin', 'Albuterol', 'Furosemide'])[((m.med_idx - 1) % 5) + 1],
  (array['500 mg', '10 mg', '20 mg', '2 puffs', '40 mg'])[((m.med_idx - 1) % 5) + 1],
  (array['BID', 'Daily', 'Daily', 'PRN', 'Daily'])[((m.med_idx - 1) % 5) + 1],
  (array['oral', 'oral', 'oral', 'inhalation', 'oral'])[((m.med_idx - 1) % 5) + 1],
  current_date - ((m.med_idx % 180) || ' days')::interval,
  null,
  'active'
from generate_series(1, 1500) as m(med_idx)
join seed_orgs so on so.org_idx = ((m.med_idx - 1) % 5) + 1
join seed_encounters se on se.encounter_idx = ((m.med_idx - 1) % 1000) + 1
join seed_patients sp
  on sp.org_idx = so.org_idx
 and sp.patient_idx = ((m.med_idx - 1) % 200) + 1
join seed_facilities sf
  on sf.org_idx = so.org_idx
 and sf.facility_idx = ((m.med_idx - 1) % 3) + 1
on conflict (id) do nothing;

insert into public.vital_signs (
  id,
  organization_id,
  facility_id,
  patient_id,
  encounter_id,
  recorded_at,
  heart_rate,
  systolic_bp,
  diastolic_bp,
  respiratory_rate,
  temperature_c,
  oxygen_saturation
)
select
  public.seed_uuid('vitals-' || v.vital_idx),
  so.organization_id,
  sf.facility_id,
  sp.patient_id,
  se.encounter_id,
  now() - ((v.vital_idx % 120) || ' days')::interval,
  60 + (v.vital_idx % 45),
  100 + (v.vital_idx % 45),
  60 + (v.vital_idx % 25),
  12 + (v.vital_idx % 12),
  36 + ((v.vital_idx % 20) / 10.0),
  90 + (v.vital_idx % 10)
from generate_series(1, 2500) as v(vital_idx)
join seed_orgs so on so.org_idx = ((v.vital_idx - 1) % 5) + 1
join seed_encounters se on se.encounter_idx = ((v.vital_idx - 1) % 1000) + 1
join seed_patients sp
  on sp.org_idx = so.org_idx
 and sp.patient_idx = ((v.vital_idx - 1) % 200) + 1
join seed_facilities sf
  on sf.org_idx = so.org_idx
 and sf.facility_idx = ((v.vital_idx - 1) % 3) + 1
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Lab results: 3000 total
-- ---------------------------------------------------------------------
insert into public.lab_results (
  id,
  organization_id,
  facility_id,
  patient_id,
  encounter_id,
  test_name,
  test_code,
  result_value,
  result_unit,
  reference_range,
  abnormal_flag,
  collected_at,
  reported_at
)
select
  public.seed_uuid('lab-' || l.lab_idx),
  so.organization_id,
  sf.facility_id,
  sp.patient_id,
  se.encounter_id,
  (array['HbA1c', 'BNP', 'Creatinine', 'LDL', 'WBC'])[((l.lab_idx - 1) % 5) + 1],
  (array['LAB-A1C', 'LAB-BNP', 'LAB-CR', 'LAB-LDL', 'LAB-WBC'])[((l.lab_idx - 1) % 5) + 1],
  round((10 + (l.lab_idx % 500) / 10.0)::numeric, 2),
  (array['%', 'pg/mL', 'mg/dL', 'mg/dL', '10^9/L'])[((l.lab_idx - 1) % 5) + 1],
  (array['4.0-5.6', '0-100', '0.6-1.3', '<100', '4.0-11.0'])[((l.lab_idx - 1) % 5) + 1],
  (l.lab_idx % 7 = 0),
  now() - ((l.lab_idx % 90) || ' days')::interval,
  now() - ((l.lab_idx % 90) || ' days')::interval + interval '4 hours'
from generate_series(1, 3000) as l(lab_idx)
join seed_orgs so on so.org_idx = ((l.lab_idx - 1) % 5) + 1
join seed_patients sp
  on sp.org_idx = so.org_idx
 and sp.patient_idx = ((l.lab_idx - 1) % 200) + 1
join seed_encounters se on se.encounter_idx = ((l.lab_idx - 1) % 1000) + 1
join seed_facilities sf
  on sf.org_idx = so.org_idx
 and sf.facility_idx = ((l.lab_idx - 1) % 3) + 1
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Claims: 2000 total
-- ---------------------------------------------------------------------
insert into public.insurance_claims (
  id,
  organization_id,
  facility_id,
  patient_id,
  encounter_id,
  claim_number,
  payer_name,
  billed_amount,
  paid_amount,
  denied_amount,
  claim_status,
  service_date,
  submitted_at
)
select
  public.seed_uuid('claim-' || c.claim_idx),
  so.organization_id,
  sf.facility_id,
  sp.patient_id,
  se.encounter_id,
  'CLM-' || lpad(c.claim_idx::text, 7, '0'),
  (array['Aetna', 'UnitedHealthcare', 'Cigna', 'Blue Cross', 'Medicare'])[((c.claim_idx - 1) % 5) + 1],
  round((500 + (c.claim_idx % 1500))::numeric, 2),
  round((400 + (c.claim_idx % 1200))::numeric, 2),
  round((c.claim_idx % 200)::numeric, 2),
  (array['submitted', 'adjudicated', 'paid', 'denied', 'pending'])[((c.claim_idx - 1) % 5) + 1],
  current_date - (c.claim_idx % 365),
  now() - ((c.claim_idx % 120) || ' days')::interval
from generate_series(1, 2000) as c(claim_idx)
join seed_orgs so on so.org_idx = ((c.claim_idx - 1) % 5) + 1
join seed_patients sp
  on sp.org_idx = so.org_idx
 and sp.patient_idx = ((c.claim_idx - 1) % 200) + 1
join seed_encounters se on se.encounter_idx = ((c.claim_idx - 1) % 1000) + 1
join seed_facilities sf
  on sf.org_idx = so.org_idx
 and sf.facility_idx = ((c.claim_idx - 1) % 3) + 1
on conflict (organization_id, claim_number) do nothing;

create temporary table seed_claims as
select
  claim_idx,
  public.seed_uuid('claim-' || claim_idx) as claim_id,
  ((claim_idx - 1) % 5) + 1 as org_idx
from generate_series(1, 2000) as claim_idx;

-- Financial transactions: 1500 total
insert into public.financial_transactions (
  id,
  organization_id,
  facility_id,
  claim_id,
  transaction_type,
  amount,
  currency,
  transaction_date,
  source_system,
  description
)
select
  public.seed_uuid('txn-' || t.txn_idx),
  so.organization_id,
  sf.facility_id,
  sc.claim_id,
  (array['charge', 'payment', 'adjustment', 'refund', 'write_off'])[((t.txn_idx - 1) % 5) + 1],
  round((100 + (t.txn_idx % 900))::numeric, 2),
  'USD',
  current_date - (t.txn_idx % 365),
  (array['Epic', 'Cerner', 'BillingEngine'])[((t.txn_idx - 1) % 3) + 1],
  'Financial transaction ' || t.txn_idx
from generate_series(1, 1500) as t(txn_idx)
join seed_orgs so on so.org_idx = ((t.txn_idx - 1) % 5) + 1
join seed_claims sc on sc.claim_idx = ((t.txn_idx - 1) % 2000) + 1
join seed_facilities sf
  on sf.org_idx = so.org_idx
 and sf.facility_idx = ((t.txn_idx - 1) % 3) + 1
on conflict (id) do nothing;

-- Revenue metrics: monthly snapshots per org/facility
insert into public.revenue_metrics (
  id,
  organization_id,
  facility_id,
  metric_name,
  period_start,
  period_end,
  gross_revenue,
  net_revenue,
  operating_margin,
  denial_rate,
  days_in_ar
)
select
  public.seed_uuid('rev-' || sf.org_idx || '-' || sf.facility_idx || '-' || m.month_idx),
  sf.organization_id,
  sf.facility_id,
  'monthly_financials',
  date_trunc('month', current_date - ((m.month_idx || ' months')::interval))::date,
  (date_trunc('month', current_date - ((m.month_idx || ' months')::interval)) + interval '1 month - 1 day')::date,
  round((1000000 + (sf.org_idx * 100000) + (sf.facility_idx * 50000) + (m.month_idx * 12000))::numeric, 2),
  round((800000 + (sf.org_idx * 85000) + (sf.facility_idx * 35000) + (m.month_idx * 10000))::numeric, 2),
  round((12 + ((sf.org_idx + m.month_idx) % 8))::numeric, 2),
  round((3 + ((sf.facility_idx + m.month_idx) % 5))::numeric, 2),
  round((35 + ((sf.org_idx + sf.facility_idx + m.month_idx) % 12))::numeric, 2)
from seed_facilities sf
cross join generate_series(0, 11) as m(month_idx)
on conflict (organization_id, facility_id, metric_name, period_start, period_end) do update
set
  gross_revenue = excluded.gross_revenue,
  net_revenue = excluded.net_revenue,
  operating_margin = excluded.operating_margin,
  denial_rate = excluded.denial_rate,
  days_in_ar = excluded.days_in_ar,
  updated_at = now();

-- ---------------------------------------------------------------------
-- Dashboard & analytics config
-- ---------------------------------------------------------------------
insert into public.widget_types (
  id,
  organization_id,
  widget_key,
  name,
  category,
  config_schema,
  is_system
)
select
  public.seed_uuid('widgettype-' || o.org_idx || '-' || wt.widget_key),
  o.organization_id,
  wt.widget_key,
  wt.name,
  wt.category,
  wt.config_schema,
  true
from seed_orgs o
cross join (
  values
    ('kpi', 'KPI', 'KPI', '{"required": ["value"]}'::jsonb),
    ('line_chart', 'Line Chart', 'Line chart', '{"required": ["x","y"]}'::jsonb),
    ('bar_chart', 'Bar Chart', 'Bar chart', '{"required": ["x","y"]}'::jsonb),
    ('pie_chart', 'Pie Chart', 'Pie chart', '{"required": ["label","value"]}'::jsonb),
    ('heatmap', 'Heatmap', 'Heatmap', '{"required": ["x","y","value"]}'::jsonb),
    ('table', 'Table', 'Table', '{"required": ["columns"]}'::jsonb),
    ('geo_map', 'Geographic Map', 'Geographic map', '{"required": ["region","value"]}'::jsonb)
) as wt(widget_key, name, category, config_schema)
on conflict (organization_id, widget_key) do update
set
  name = excluded.name,
  category = excluded.category,
  config_schema = excluded.config_schema,
  updated_at = now();

insert into public.dashboards (
  id,
  organization_id,
  facility_id,
  role_id,
  name,
  slug,
  description,
  status,
  layout_config,
  created_by
)
select
  public.seed_uuid('dashboard-' || o.org_idx || '-' || d.role_slug),
  o.organization_id,
  null,
  public.seed_uuid('role-' || o.org_idx || '-' || d.role_slug),
  initcap(d.role_slug) || ' Dashboard',
  d.role_slug || '-dashboard',
  d.description,
  'active',
  '{"columns":12,"rowHeight":120}'::jsonb,
  public.seed_uuid('user-' || o.org_idx || '-1')
from seed_orgs o
cross join (
  values
    ('admin', 'System metrics, user activity, integrations, alerts'),
    ('executive', 'Revenue analytics, KPI metrics, operational performance'),
    ('physician', 'Patient outcomes, readmission rates, clinical metrics'),
    ('analyst', 'Population health, cohort analysis, predictive analytics')
) as d(role_slug, description)
on conflict (organization_id, slug) do update
set
  name = excluded.name,
  description = excluded.description,
  role_id = excluded.role_id,
  updated_at = now();

create temporary table seed_dashboards as
select
  o.org_idx,
  o.organization_id,
  d.role_slug,
  public.seed_uuid('dashboard-' || o.org_idx || '-' || d.role_slug) as dashboard_id
from seed_orgs o
cross join (values ('admin'), ('executive'), ('physician'), ('analyst')) as d(role_slug);

insert into public.dashboard_widgets (
  id,
  organization_id,
  dashboard_id,
  widget_type_id,
  title,
  widget_key,
  position_x,
  position_y,
  width,
  height,
  config,
  filters,
  is_visible
)
select
  public.seed_uuid('dw-' || sd.org_idx || '-' || sd.role_slug || '-' || w.widget_idx),
  sd.organization_id,
  sd.dashboard_id,
  public.seed_uuid('widgettype-' || sd.org_idx || '-' || w.widget_key),
  initcap(replace(w.widget_key, '_', ' ')) || ' Widget',
  w.widget_key,
  case w.widget_idx when 1 then 0 when 2 then 4 else 8 end,
  0,
  4,
  3,
  '{}'::jsonb,
  '{}'::jsonb,
  true
from seed_dashboards sd
cross join (
  values
    (1, 'kpi'),
    (2, 'line_chart'),
    (3, 'table')
) as w(widget_idx, widget_key)
on conflict (id) do nothing;

insert into public.analytics_models (
  id,
  organization_id,
  model_name,
  model_type,
  version,
  status,
  training_window,
  parameters,
  metrics,
  deployed_at
)
select
  public.seed_uuid('model-' || o.org_idx || '-' || m.model_idx),
  o.organization_id,
  case m.model_idx when 1 then 'Readmission Risk Model' else 'Revenue Forecast Model' end,
  case m.model_idx when 1 then 'clinical' else 'financial' end,
  'v1.0.' || m.model_idx,
  'active',
  'last_12_months',
  jsonb_build_object('algorithm', case m.model_idx when 1 then 'xgboost' else 'arima' end),
  jsonb_build_object('auc', 0.79 + (m.model_idx * 0.03), 'mae', 0.12 + (m.model_idx * 0.01)),
  now() - ((m.model_idx * 15) || ' days')::interval
from seed_orgs o
cross join generate_series(1, 2) as m(model_idx)
on conflict (organization_id, model_name, version) do nothing;

insert into public.reports (
  id,
  organization_id,
  facility_id,
  role_id,
  report_name,
  report_type,
  schedule_cron,
  status,
  parameters,
  owner_user_id
)
select
  public.seed_uuid('report-' || o.org_idx || '-' || r.report_idx),
  o.organization_id,
  null,
  public.seed_uuid('role-' || o.org_idx || '-' || r.role_slug),
  r.report_name,
  r.role_slug,
  '0 8 * * 1',
  'active',
  '{}'::jsonb,
  public.seed_uuid('user-' || o.org_idx || '-1')
from seed_orgs o
cross join (
  values
    (1, 'admin', 'Admin Weekly Monitoring Report'),
    (2, 'executive', 'Executive KPI Summary'),
    (3, 'physician', 'Clinical Outcomes Report'),
    (4, 'analyst', 'Population Cohort Analysis')
) as r(report_idx, role_slug, report_name)
on conflict (id) do nothing;

insert into public.report_exports (
  id,
  organization_id,
  report_id,
  requested_by_user_id,
  export_format,
  export_status,
  storage_provider,
  storage_path,
  file_size_bytes,
  expires_at
)
select
  public.seed_uuid('report-export-' || o.org_idx || '-' || e.export_idx),
  o.organization_id,
  public.seed_uuid('report-' || o.org_idx || '-' || (((e.export_idx - 1) % 4) + 1)),
  public.seed_uuid('user-' || o.org_idx || '-1'),
  (array['pdf', 'csv', 'xlsx'])[((e.export_idx - 1) % 3) + 1],
  (array['ready', 'processing'])[((e.export_idx - 1) % 2) + 1],
  's3',
  'exports/org-' || o.org_idx || '/report-' || e.export_idx || '.dat',
  2048 + (e.export_idx * 512),
  now() + interval '7 days'
from seed_orgs o
cross join generate_series(1, 6) as e(export_idx)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Alerts (rules, alerts, events, subscriptions)
-- Alerts target: 200 rows
-- ---------------------------------------------------------------------
insert into public.alert_rules (
  id,
  organization_id,
  facility_id,
  rule_name,
  alert_type,
  metric_name,
  operator,
  threshold,
  severity,
  is_active,
  config
)
select
  public.seed_uuid('alertrule-' || o.org_idx || '-' || r.rule_idx),
  o.organization_id,
  public.seed_uuid('facility-' || o.org_idx || '-' || (((r.rule_idx - 1) % 3) + 1)),
  case r.rule_idx
    when 1 then 'High Readmission Rate'
    when 2 then 'Abnormal Lab Value Spike'
    else 'Financial Threshold Breach'
  end,
  case r.rule_idx
    when 1 then 'clinical'
    when 2 then 'clinical'
    else 'financial'
  end,
  case r.rule_idx
    when 1 then 'readmission_rate'
    when 2 then 'abnormal_lab_count'
    else 'financial_loss'
  end,
  '>',
  case r.rule_idx when 1 then 12 when 2 then 10 else 250000 end,
  case r.rule_idx when 3 then 'critical' else 'high' end,
  true,
  '{}'::jsonb
from seed_orgs o
cross join generate_series(1, 3) as r(rule_idx)
on conflict (id) do nothing;

insert into public.alerts (
  id,
  organization_id,
  facility_id,
  rule_id,
  alert_type,
  title,
  description,
  severity,
  status,
  triggered_value,
  threshold_value,
  owner_user_id
)
select
  public.seed_uuid('alert-' || a.alert_idx),
  so.organization_id,
  sf.facility_id,
  public.seed_uuid('alertrule-' || so.org_idx || '-' || (((a.alert_idx - 1) % 3) + 1)),
  case ((a.alert_idx - 1) % 3) + 1
    when 1 then 'clinical'
    when 2 then 'clinical'
    else 'financial'
  end,
  'Alert #' || a.alert_idx,
  'Automated alert event for organization ' || so.org_idx,
  case ((a.alert_idx - 1) % 4)
    when 0 then 'low'
    when 1 then 'medium'
    when 2 then 'high'
    else 'critical'
  end,
  case ((a.alert_idx - 1) % 4)
    when 0 then 'new'
    when 1 then 'acknowledged'
    when 2 then 'resolved'
    else 'new'
  end,
  round((10 + (a.alert_idx % 400))::numeric, 2),
  round((20 + (a.alert_idx % 300))::numeric, 2),
  public.seed_uuid('user-' || so.org_idx || '-1')
from generate_series(1, 200) as a(alert_idx)
join seed_orgs so on so.org_idx = ((a.alert_idx - 1) % 5) + 1
join seed_facilities sf on sf.org_idx = so.org_idx and sf.facility_idx = ((a.alert_idx - 1) % 3) + 1
on conflict (id) do nothing;

insert into public.alert_events (
  id,
  organization_id,
  alert_id,
  event_type,
  event_payload,
  event_time
)
select
  public.seed_uuid('alertevent-' || a.alert_idx),
  so.organization_id,
  public.seed_uuid('alert-' || a.alert_idx),
  'triggered',
  jsonb_build_object('source', 'seed', 'alert_idx', a.alert_idx),
  now() - ((a.alert_idx % 90) || ' days')::interval
from generate_series(1, 200) as a(alert_idx)
join seed_orgs so on so.org_idx = ((a.alert_idx - 1) % 5) + 1
on conflict (id) do nothing;

insert into public.alert_subscriptions (
  id,
  organization_id,
  alert_rule_id,
  user_id,
  channel,
  is_enabled
)
select
  public.seed_uuid('alertsub-' || so.org_idx || '-' || r.rule_idx || '-' || u.user_idx || '-' || ch.channel),
  so.organization_id,
  public.seed_uuid('alertrule-' || so.org_idx || '-' || r.rule_idx),
  public.seed_uuid('user-' || so.org_idx || '-' || u.user_idx),
  ch.channel,
  true
from seed_orgs so
cross join generate_series(1, 3) as r(rule_idx)
cross join (values (1), (2), (3)) as u(user_idx)
cross join (values ('in_app'), ('email')) as ch(channel)
on conflict (organization_id, alert_rule_id, user_id, channel) do nothing;

-- ---------------------------------------------------------------------
-- Integration hub data
-- ---------------------------------------------------------------------
insert into public.data_sources (
  id,
  organization_id,
  facility_id,
  source_name,
  source_type,
  endpoint,
  auth_type,
  status,
  config
)
select
  public.seed_uuid('datasource-' || o.org_idx || '-' || s.source_idx),
  o.organization_id,
  null,
  case s.source_idx when 1 then 'FHIR API' when 2 then 'Epic' else 'Cerner' end,
  case s.source_idx when 1 then 'fhir' when 2 then 'epic' else 'cerner' end,
  case s.source_idx
    when 1 then 'https://fhir.healthscope.example/api'
    when 2 then 'https://epic.healthscope.example/api'
    else 'https://cerner.healthscope.example/api'
  end,
  'oauth2',
  'active',
  '{}'::jsonb
from seed_orgs o
cross join generate_series(1, 3) as s(source_idx)
on conflict (id) do nothing;

insert into public.integration_connections (
  id,
  organization_id,
  data_source_id,
  connector_name,
  connector_type,
  status,
  last_sync_at,
  latency_ms,
  config
)
select
  public.seed_uuid('integration-conn-' || o.org_idx || '-' || c.conn_idx),
  o.organization_id,
  public.seed_uuid('datasource-' || o.org_idx || '-' || c.conn_idx),
  case c.conn_idx when 1 then 'FHIR Connector' when 2 then 'Epic Connector' else 'Cerner Connector' end,
  case c.conn_idx when 1 then 'fhir' when 2 then 'epic' else 'cerner' end,
  (array['healthy', 'warning', 'healthy'])[(c.conn_idx)],
  now() - ((c.conn_idx * 10) || ' minutes')::interval,
  100 + (c.conn_idx * 50),
  '{}'::jsonb
from seed_orgs o
cross join generate_series(1, 3) as c(conn_idx)
on conflict (id) do nothing;

insert into public.integration_jobs (
  id,
  organization_id,
  connection_id,
  job_type,
  status,
  payload,
  started_at,
  finished_at,
  duration_ms
)
select
  public.seed_uuid('integration-job-' || j.job_idx),
  so.organization_id,
  public.seed_uuid('integration-conn-' || so.org_idx || '-' || (((j.job_idx - 1) % 3) + 1)),
  (array['sync_patients', 'sync_encounters', 'sync_labs'])[((j.job_idx - 1) % 3) + 1],
  (array['queued', 'running', 'succeeded', 'failed'])[((j.job_idx - 1) % 4) + 1],
  jsonb_build_object('batch', j.job_idx),
  now() - ((j.job_idx % 240) || ' minutes')::interval,
  now() - (((j.job_idx % 240) - 10) || ' minutes')::interval,
  500 + (j.job_idx % 5000)
from generate_series(1, 300) as j(job_idx)
join seed_orgs so on so.org_idx = ((j.job_idx - 1) % 5) + 1
on conflict (id) do nothing;

insert into public.integration_logs (
  id,
  organization_id,
  job_id,
  connection_id,
  log_level,
  message,
  details,
  logged_at
)
select
  public.seed_uuid('integration-log-' || l.log_idx),
  so.organization_id,
  public.seed_uuid('integration-job-' || (((l.log_idx - 1) % 300) + 1)),
  public.seed_uuid('integration-conn-' || so.org_idx || '-' || (((l.log_idx - 1) % 3) + 1)),
  (array['debug', 'info', 'warn', 'error'])[((l.log_idx - 1) % 4) + 1],
  'Integration log message #' || l.log_idx,
  jsonb_build_object('step', l.log_idx % 10),
  now() - ((l.log_idx % 720) || ' minutes')::interval
from generate_series(1, 800) as l(log_idx)
join seed_orgs so on so.org_idx = ((l.log_idx - 1) % 5) + 1
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Activity tracking tables
-- ---------------------------------------------------------------------
insert into public.dashboard_views (
  id,
  organization_id,
  user_id,
  dashboard_id,
  facility_id,
  viewed_at,
  duration_seconds
)
select
  public.seed_uuid('dashview-' || v.view_idx),
  so.organization_id,
  public.seed_uuid('user-' || so.org_idx || '-' || (((v.view_idx - 1) % 10) + 1)),
  public.seed_uuid('dashboard-' || so.org_idx || '-' || (array['admin', 'executive', 'physician', 'analyst'])[((v.view_idx - 1) % 4) + 1]),
  public.seed_uuid('facility-' || so.org_idx || '-' || (((v.view_idx - 1) % 3) + 1)),
  now() - ((v.view_idx % 180) || ' days')::interval,
  30 + (v.view_idx % 900)
from generate_series(1, 3000) as v(view_idx)
join seed_orgs so on so.org_idx = ((v.view_idx - 1) % 5) + 1
on conflict (id) do nothing;

insert into public.user_events (
  id,
  organization_id,
  user_id,
  event_type,
  event_name,
  page,
  payload,
  event_time
)
select
  public.seed_uuid('userevent-' || e.event_idx),
  so.organization_id,
  public.seed_uuid('user-' || so.org_idx || '-' || (((e.event_idx - 1) % 10) + 1)),
  (array['login', 'dashboard_view', 'alert_view', 'report_export'])[((e.event_idx - 1) % 4) + 1],
  (array['User Login', 'Dashboard Viewed', 'Alert Opened', 'Report Export Requested'])[((e.event_idx - 1) % 4) + 1],
  (array['/login', '/dashboard', '/dashboard/alerts', '/dashboard/executive'])[((e.event_idx - 1) % 4) + 1],
  jsonb_build_object('event_idx', e.event_idx),
  now() - ((e.event_idx % 720) || ' minutes')::interval
from generate_series(1, 4000) as e(event_idx)
join seed_orgs so on so.org_idx = ((e.event_idx - 1) % 5) + 1
on conflict (id) do nothing;

insert into public.audit_logs (
  id,
  organization_id,
  actor_user_id,
  action,
  table_name,
  record_id,
  old_values,
  new_values,
  ip_address,
  user_agent
)
select
  public.seed_uuid('audit-' || a.audit_idx),
  so.organization_id,
  public.seed_uuid('user-' || so.org_idx || '-1'),
  (array['insert', 'update', 'delete'])[((a.audit_idx - 1) % 3) + 1],
  (array['users', 'facilities', 'dashboards', 'alerts'])[((a.audit_idx - 1) % 4) + 1],
  md5(a.audit_idx::text),
  '{}'::jsonb,
  jsonb_build_object('audit_idx', a.audit_idx),
  ('10.20.' || so.org_idx || '.' || ((a.audit_idx % 200) + 1))::inet,
  'HealthScope Audit Agent'
from generate_series(1, 1500) as a(audit_idx)
join seed_orgs so on so.org_idx = ((a.audit_idx - 1) % 5) + 1
on conflict (id) do nothing;

commit;
