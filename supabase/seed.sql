insert into public.organizations (id, name, slug, plan_tier, payer_focus)
values
  ('11111111-1111-1111-1111-111111111111', 'NorthStar Health Network', 'northstar-health-network', 'enterprise', 'Commercial + Medicare Advantage')
on conflict (id) do nothing;

insert into public.facilities (id, organization_id, name, facility_type, city, state, bed_count)
values
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'NorthStar Medical Center', 'Acute Care Hospital', 'Seattle', 'WA', 340),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'NorthStar Specialty Pavilion', 'Specialty Clinic', 'Bellevue', 'WA', 88)
on conflict (id) do nothing;

insert into public.profiles (id, full_name, title)
select
  user_row.id,
  coalesce(
    nullif(user_row.raw_user_meta_data ->> 'full_name', ''),
    split_part(user_row.email, '@', 1)
  ),
  coalesce(
    nullif(user_row.raw_user_meta_data ->> 'title', ''),
    'Healthcare Analyst'
  )
from auth.users as user_row
on conflict (id) do update
set
  full_name = excluded.full_name,
  title = excluded.title;

insert into public.organization_memberships (user_id, organization_id, role, default_facility_id)
select
  user_row.id,
  '11111111-1111-1111-1111-111111111111',
  'analyst',
  '22222222-2222-2222-2222-222222222221'
from auth.users as user_row
on conflict (user_id, organization_id) do update
set
  default_facility_id = excluded.default_facility_id;

insert into public.providers (id, organization_id, facility_id, full_name, npi, specialty)
values
  ('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Dr. Helena Ford', '1245600012', 'Cardiology'),
  ('55555555-5555-5555-5555-555555555552', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Dr. Omar Benson', '1245600013', 'Internal Medicine'),
  ('55555555-5555-5555-5555-555555555553', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Dr. Nina Patel', '1245600014', 'Pulmonology')
on conflict (id) do nothing;

insert into public.patients (id, organization_id, facility_id, full_name, date_of_birth, gender, primary_condition, risk_level)
values
  ('66666666-6666-6666-6666-666666666661', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Ruth Campbell', '1951-04-10', 'Female', 'Congestive heart failure', 'high'),
  ('66666666-6666-6666-6666-666666666662', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Darren Ellis', '1968-11-23', 'Male', 'Type 2 diabetes', 'moderate'),
  ('66666666-6666-6666-6666-666666666663', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Priya Nair', '1978-02-05', 'Female', 'COPD', 'high')
on conflict (id) do nothing;

insert into public.diagnoses (patient_id, code, description)
values
  ('66666666-6666-6666-6666-666666666661', 'I50.9', 'Heart failure, unspecified'),
  ('66666666-6666-6666-6666-666666666662', 'E11.9', 'Type 2 diabetes mellitus without complications'),
  ('66666666-6666-6666-6666-666666666663', 'J44.9', 'Chronic obstructive pulmonary disease')
on conflict do nothing;

insert into public.lab_results (patient_id, test_name, value_numeric, abnormal_flag, collected_at)
values
  ('66666666-6666-6666-6666-666666666661', 'BNP', 620, true, '2026-03-14T06:00:00Z'),
  ('66666666-6666-6666-6666-666666666662', 'HbA1c', 8.4, true, '2026-03-13T13:30:00Z'),
  ('66666666-6666-6666-6666-666666666663', 'SpO2', 95, false, '2026-03-14T05:20:00Z')
on conflict do nothing;

insert into public.clinical_metrics (organization_id, facility_id, metric_name, current_value, target_value, unit, trend_direction)
values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Sepsis bundle compliance', 78, 85, '%', 'up'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Medication reconciliation', 91, 95, '%', 'stable'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Average length of stay', 4.6, 4.3, 'days', 'down')
on conflict do nothing;

insert into public.financial_metrics (organization_id, facility_id, metric_name, current_display, target_display, note)
values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Denied claims', '4.9%', '< 4.0%', 'MRI prior auth denials remain elevated'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Margin per case', '$1,842', '$1,700', 'Strong surgical line performance'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Days in A/R', '39.2', '< 42', 'Trending favorably after coding workflow updates')
on conflict do nothing;

insert into public.population_segments (organization_id, cohort_name, member_count, completion_rate, risk_level)
values
  ('11111111-1111-1111-1111-111111111111', 'CHF high-risk cohort', 342, 71, 'high'),
  ('11111111-1111-1111-1111-111111111111', 'Diabetes care gap outreach', 1188, 64, 'moderate'),
  ('11111111-1111-1111-1111-111111111111', 'Preventive screening outreach', 4860, 82, 'low')
on conflict do nothing;

insert into public.alerts (organization_id, facility_id, module_name, title, description, severity, status, owner_name, created_at)
values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Financial', 'Imaging denial rate breached threshold', 'Commercial payer denials exceeded 6% for advanced imaging over the past 48 hours.', 'high', 'new', 'Revenue Cycle Director', '2026-03-14T07:10:00Z'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Population', 'Readmission cohort risk rising', 'Cardiology discharges with readmission risk over 0.7 increased by 11% week over week.', 'critical', 'acknowledged', 'Population Health Lead', '2026-03-14T06:15:00Z'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Integrations', 'FHIR encounter feed latency warning', 'Encounter resource sync exceeded the 15 minute SLA for two consecutive cycles.', 'medium', 'new', 'Integration Engineering', '2026-03-14T05:42:00Z')
on conflict do nothing;

insert into public.integration_connections (organization_id, source_name, category_name, standard_name, status, latency_minutes, last_sync_at)
values
  ('11111111-1111-1111-1111-111111111111', 'Epic Inpatient', 'EHR', 'FHIR R4', 'healthy', 3, '2026-03-14T07:20:00Z'),
  ('11111111-1111-1111-1111-111111111111', 'Cerner Ambulatory', 'EHR', 'HL7 v2 / FHIR', 'healthy', 8, '2026-03-14T07:14:00Z'),
  ('11111111-1111-1111-1111-111111111111', 'Claims Clearinghouse', 'Financial', 'X12', 'warning', 58, '2026-03-14T06:31:00Z')
on conflict do nothing;

insert into public.report_exports (organization_id, title, export_format, status, storage_path, created_at)
values
  ('11111111-1111-1111-1111-111111111111', 'Executive Board Packet - March 2026', 'pdf', 'ready', 'exports/board-packet-mar-2026.pdf', '2026-03-13T18:00:00Z'),
  ('11111111-1111-1111-1111-111111111111', 'Population Health Outreach List', 'csv', 'processing', null, '2026-03-14T07:12:00Z')
on conflict do nothing;

-- ==========================================================
-- HealthScope Analytics Suite v2 seed: RBAC and admin config
-- ==========================================================

insert into public.roles (organization_id, name, slug, description, is_system)
values
  ('11111111-1111-1111-1111-111111111111', 'Admin', 'admin', 'Organization administrator with full platform access', true),
  ('11111111-1111-1111-1111-111111111111', 'Executive', 'executive', 'Executive stakeholders with KPI and financial analytics access', true),
  ('11111111-1111-1111-1111-111111111111', 'Physician', 'physician', 'Clinical users focused on patient outcomes and lab intelligence', true),
  ('11111111-1111-1111-1111-111111111111', 'Analyst', 'analyst', 'Data and population health analytics specialists', true)
on conflict (organization_id, slug) do update
set
  name = excluded.name,
  description = excluded.description,
  is_system = excluded.is_system,
  updated_at = now();

insert into public.permissions (organization_id, code, name, description)
values
  ('11111111-1111-1111-1111-111111111111', 'users.manage', 'Manage users', 'Create users, activate/deactivate users, and assign access'),
  ('11111111-1111-1111-1111-111111111111', 'facilities.manage', 'Manage facilities', 'Manage facilities and facility metadata'),
  ('11111111-1111-1111-1111-111111111111', 'dashboards.configure', 'Configure dashboards', 'Build and configure role-based dashboards'),
  ('11111111-1111-1111-1111-111111111111', 'integrations.manage', 'Manage integrations', 'Configure and monitor integration connectors'),
  ('11111111-1111-1111-1111-111111111111', 'alerts.configure', 'Configure alerts', 'Configure alert rules and subscription settings'),
  ('11111111-1111-1111-1111-111111111111', 'analytics.models.manage', 'Manage analytics models', 'Configure predictive and analytical model settings'),
  ('11111111-1111-1111-1111-111111111111', 'organization.settings.manage', 'Manage organization settings', 'Configure organization-level settings and preferences'),
  ('11111111-1111-1111-1111-111111111111', 'dashboards.executive.view', 'View executive dashboards', 'View executive dashboards and KPI scorecards'),
  ('11111111-1111-1111-1111-111111111111', 'analytics.financial.view', 'View financial analytics', 'View financial trends and revenue analytics'),
  ('11111111-1111-1111-1111-111111111111', 'reports.view', 'View reports', 'View generated reports and schedules'),
  ('11111111-1111-1111-1111-111111111111', 'kpi.view', 'View KPI metrics', 'View KPI summary and trends'),
  ('11111111-1111-1111-1111-111111111111', 'analytics.patient.view', 'View patient analytics', 'Analyze patient-level outcomes and cohorts'),
  ('11111111-1111-1111-1111-111111111111', 'dashboards.clinical.view', 'View clinical dashboard', 'View clinical dashboards and quality metrics'),
  ('11111111-1111-1111-1111-111111111111', 'labs.view', 'View lab results', 'Access laboratory data and outlier trends'),
  ('11111111-1111-1111-1111-111111111111', 'diagnoses.view', 'View diagnoses', 'Access diagnosis tracking and coding distributions'),
  ('11111111-1111-1111-1111-111111111111', 'analytics.population.view', 'View population analytics', 'Access population health and care-gap metrics'),
  ('11111111-1111-1111-1111-111111111111', 'reports.build', 'Build reports', 'Create and configure report templates and exports'),
  ('11111111-1111-1111-1111-111111111111', 'cohorts.manage', 'Manage cohorts', 'Define and analyze cohorts for population studies')
on conflict (organization_id, code) do update
set
  name = excluded.name,
  description = excluded.description,
  updated_at = now();

insert into public.role_permissions (organization_id, role_id, permission_id)
select
  '11111111-1111-1111-1111-111111111111',
  role_map.id,
  permission_map.id
from public.roles role_map
join public.permissions permission_map
  on permission_map.organization_id = role_map.organization_id
where role_map.organization_id = '11111111-1111-1111-1111-111111111111'
  and (
    (role_map.slug = 'admin' and permission_map.code in (
      'users.manage',
      'facilities.manage',
      'dashboards.configure',
      'integrations.manage',
      'alerts.configure',
      'analytics.models.manage',
      'organization.settings.manage',
      'reports.build',
      'reports.view',
      'kpi.view'
    ))
    or (role_map.slug = 'executive' and permission_map.code in (
      'dashboards.executive.view',
      'analytics.financial.view',
      'reports.view',
      'kpi.view'
    ))
    or (role_map.slug = 'physician' and permission_map.code in (
      'analytics.patient.view',
      'dashboards.clinical.view',
      'labs.view',
      'diagnoses.view'
    ))
    or (role_map.slug = 'analyst' and permission_map.code in (
      'analytics.population.view',
      'reports.build',
      'cohorts.manage',
      'kpi.view'
    ))
  )
on conflict (organization_id, role_id, permission_id) do nothing;

insert into public.widget_types (organization_id, widget_key, name, category, schema, is_system)
values
  ('11111111-1111-1111-1111-111111111111', 'kpi', 'KPI', 'KPI', '{"metrics": ["value", "change"]}', true),
  ('11111111-1111-1111-1111-111111111111', 'line_chart', 'Line Chart', 'Line chart', '{"x": "time", "y": "value"}', true),
  ('11111111-1111-1111-1111-111111111111', 'bar_chart', 'Bar Chart', 'Bar chart', '{"x": "category", "y": "value"}', true),
  ('11111111-1111-1111-1111-111111111111', 'pie_chart', 'Pie Chart', 'Pie chart', '{"groupBy": "category"}', true),
  ('11111111-1111-1111-1111-111111111111', 'heatmap', 'Heatmap', 'Heatmap', '{"x": "date", "y": "segment"}', true),
  ('11111111-1111-1111-1111-111111111111', 'table', 'Table', 'Table', '{"columns": []}', true),
  ('11111111-1111-1111-1111-111111111111', 'geographic_map', 'Geographic Map', 'Geographic map', '{"regionField": "state"}', true)
on conflict (organization_id, widget_key) do update
set
  name = excluded.name,
  category = excluded.category,
  schema = excluded.schema,
  updated_at = now();

insert into public.dashboards (organization_id, facility_id, role_slug, name, slug, description, status, layout_config)
values
  ('11111111-1111-1111-1111-111111111111', null, 'admin', 'Admin Dashboard', 'admin-dashboard', 'System metrics, active users, integration status, and alerts.', 'active', '{"columns": 12}'),
  ('11111111-1111-1111-1111-111111111111', null, 'executive', 'Executive Dashboard', 'executive-dashboard', 'Revenue analytics, KPIs, and operational performance.', 'active', '{"columns": 12}'),
  ('11111111-1111-1111-1111-111111111111', null, 'physician', 'Physician Dashboard', 'physician-dashboard', 'Clinical outcomes, readmissions, and lab trends.', 'active', '{"columns": 12}'),
  ('11111111-1111-1111-1111-111111111111', null, 'analyst', 'Analyst Dashboard', 'analyst-dashboard', 'Population health and cohort analysis workspace.', 'active', '{"columns": 12}')
on conflict (organization_id, slug) do update
set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  layout_config = excluded.layout_config,
  updated_at = now();

insert into public.organization_settings (organization_id, setting_key, setting_value, scope)
values
  ('11111111-1111-1111-1111-111111111111', 'timezone', '"America/Los_Angeles"', 'organization'),
  ('11111111-1111-1111-1111-111111111111', 'currency', '"USD"', 'organization'),
  ('11111111-1111-1111-1111-111111111111', 'alerts.default_channels', '["in_app", "email"]', 'organization'),
  ('11111111-1111-1111-1111-111111111111', 'dashboards.refresh_interval_seconds', '60', 'organization')
on conflict do nothing;

update public.organization_settings
set
  setting_value = '"America/Los_Angeles"'::jsonb,
  updated_at = now()
where organization_id = '11111111-1111-1111-1111-111111111111'
  and setting_key = 'timezone'
  and scope = 'organization'
  and facility_id is null;

update public.organization_settings
set
  setting_value = '"USD"'::jsonb,
  updated_at = now()
where organization_id = '11111111-1111-1111-1111-111111111111'
  and setting_key = 'currency'
  and scope = 'organization'
  and facility_id is null;

update public.organization_settings
set
  setting_value = '["in_app", "email"]'::jsonb,
  updated_at = now()
where organization_id = '11111111-1111-1111-1111-111111111111'
  and setting_key = 'alerts.default_channels'
  and scope = 'organization'
  and facility_id is null;

update public.organization_settings
set
  setting_value = '60'::jsonb,
  updated_at = now()
where organization_id = '11111111-1111-1111-1111-111111111111'
  and setting_key = 'dashboards.refresh_interval_seconds'
  and scope = 'organization'
  and facility_id is null;

insert into public.alert_rules (
  organization_id,
  facility_id,
  rule_name,
  alert_type,
  metric_name,
  operator,
  threshold,
  severity,
  status
)
values
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'High readmission rate', 'clinical', 'readmission_rate', '>', 12, 'high', 'active'),
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Abnormal lab threshold', 'clinical', 'abnormal_lab_count', '>', 10, 'high', 'active'),
  ('11111111-1111-1111-1111-111111111111', null, 'Financial loss threshold', 'financial', 'financial_losses', '>', 250000, 'critical', 'active')
on conflict do nothing;

insert into public.data_sources (organization_id, facility_id, source_name, source_type, endpoint, auth_type, status)
values
  ('11111111-1111-1111-1111-111111111111', null, 'FHIR API', 'fhir', 'https://fhir.example.org', 'token', 'active'),
  ('11111111-1111-1111-1111-111111111111', null, 'Epic', 'epic', 'https://epic.example.org', 'oauth2', 'active'),
  ('11111111-1111-1111-1111-111111111111', null, 'Cerner', 'cerner', 'https://cerner.example.org', 'oauth2', 'active')
on conflict do nothing;

insert into public.reports (organization_id, facility_id, role_id, owner_user_id, name, category, status, schedule_cron, parameters)
select
  '11111111-1111-1111-1111-111111111111',
  null,
  role_map.id,
  null,
  case role_map.slug
    when 'executive' then 'Executive Weekly KPI Report'
    when 'physician' then 'Clinical Outcomes Snapshot'
    when 'analyst' then 'Population Cohort Trend Report'
    else 'Admin Monitoring Report'
  end,
  role_map.slug,
  'active',
  '0 8 * * 1',
  '{}'::jsonb
from public.roles role_map
where role_map.organization_id = '11111111-1111-1111-1111-111111111111'
on conflict do nothing;

insert into public.report_templates (organization_id, name, template_type, definition, version, status)
values
  ('11111111-1111-1111-1111-111111111111', 'Executive KPI Template', 'executive', '{"sections": ["financial", "operations", "quality"]}', 1, 'active'),
  ('11111111-1111-1111-1111-111111111111', 'Clinical Outcomes Template', 'clinical', '{"sections": ["readmission", "lab", "diagnoses"]}', 1, 'active'),
  ('11111111-1111-1111-1111-111111111111', 'Population Health Template', 'population', '{"sections": ["cohorts", "risk", "completion"]}', 1, 'active')
on conflict do nothing;

-- Seed users from auth.users for tenant/user management
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
select
  user_row.id,
  '11111111-1111-1111-1111-111111111111',
  user_row.email,
  coalesce(nullif(user_row.raw_user_meta_data ->> 'full_name', ''), split_part(user_row.email, '@', 1)),
  coalesce(nullif(user_row.raw_user_meta_data ->> 'title', ''), 'Healthcare Analyst'),
  'active',
  now(),
  role_map.id,
  '22222222-2222-2222-2222-222222222221'
from auth.users user_row
left join public.roles role_map
  on role_map.organization_id = '11111111-1111-1111-1111-111111111111'
 and role_map.slug = 'analyst'
on conflict (id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  title = excluded.title,
  status = excluded.status,
  last_login = excluded.last_login,
  role_id = excluded.role_id,
  facility_id = excluded.facility_id,
  updated_at = now();

insert into public.user_roles (organization_id, user_id, role_id, facility_id, status)
select
  '11111111-1111-1111-1111-111111111111',
  user_row.id,
  role_map.id,
  '22222222-2222-2222-2222-222222222221',
  'active'
from auth.users user_row
join public.roles role_map
  on role_map.organization_id = '11111111-1111-1111-1111-111111111111'
 and role_map.slug = 'analyst'
on conflict (organization_id, user_id, role_id, facility_id) do nothing;

insert into public.user_facility_access (organization_id, user_id, facility_id, role_id, is_primary, status)
select
  '11111111-1111-1111-1111-111111111111',
  user_row.id,
  '22222222-2222-2222-2222-222222222221',
  role_map.id,
  true,
  'active'
from auth.users user_row
left join public.roles role_map
  on role_map.organization_id = '11111111-1111-1111-1111-111111111111'
 and role_map.slug = 'analyst'
on conflict (organization_id, user_id, facility_id) do nothing;

insert into public.user_events (organization_id, user_id, event_type, event_name, dashboard_slug, payload, occurred_at)
select
  '11111111-1111-1111-1111-111111111111',
  user_row.id,
  'seed',
  'Seeded baseline activity',
  'admin-dashboard',
  '{"source": "seed.sql"}'::jsonb,
  now()
from auth.users user_row
on conflict do nothing;
