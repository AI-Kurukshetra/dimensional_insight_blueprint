-- RBAC + activity tracking bootstrap for Next.js API permission middleware

begin;

-- Activity log sink
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_logs_org_created
  on public.activity_logs (organization_id, created_at desc);

create index if not exists idx_activity_logs_user_created
  on public.activity_logs (user_id, created_at desc);

alter table if exists public.roles add column if not exists name text;
update public.roles set name = coalesce(name, role_slug) where name is null;

alter table if exists public.permissions add column if not exists name text;
update public.permissions set name = coalesce(name, code) where name is null;

-- Ensure required roles exist for each organization
insert into public.roles (organization_id, name, slug, description, is_system)
select
  o.id,
  initcap(r.slug),
  r.slug,
  r.description,
  true
from public.organizations o
cross join (
  values
    ('admin', 'Full tenant and system administration'),
    ('executive', 'Executive and financial analytics access'),
    ('doctor', 'Clinical and treatment outcome access'),
    ('analyst', 'Analytics builder and reporting access'),
    ('viewer', 'Read-only dashboard access')
) as r(slug, description)
on conflict (organization_id, slug) do update
set
  name = excluded.name,
  description = excluded.description,
  is_system = true,
  updated_at = now();

-- Ensure required permissions exist for each organization
insert into public.permissions (organization_id, code, name, description)
select
  o.id,
  p.code,
  p.name,
  p.description
from public.organizations o
cross join (
  values
    ('manage.organizations', 'Manage Organizations', 'Create/update organization configuration'),
    ('manage.facilities', 'Manage Facilities', 'Create/update facilities'),
    ('manage.users', 'Manage Users', 'Invite and manage users'),
    ('view.all.dashboards', 'View All Dashboards', 'Access all dashboard modules'),
    ('manage.integrations', 'Manage Integrations', 'Configure external integrations'),
    ('configure.alerts', 'Configure Alerts', 'Manage alert rules and subscriptions'),
    ('view.executive.dashboards', 'View Executive Dashboards', 'Executive KPI and board views'),
    ('view.financial.reports', 'View Financial Reports', 'Access financial reporting'),
    ('view.operational.analytics', 'View Operational Analytics', 'Access operations analytics'),
    ('export.reports', 'Export Reports', 'Export report files'),
    ('view.clinical.dashboards', 'View Clinical Dashboards', 'Access clinical dashboards'),
    ('view.patient.data', 'View Patient Data', 'Read patient-level data'),
    ('view.treatment.outcomes', 'View Treatment Outcomes', 'Read treatment outcomes'),
    ('create.dashboards', 'Create Dashboards', 'Create dashboard definitions'),
    ('run.analytics.queries', 'Run Analytics Queries', 'Execute analytics workloads'),
    ('generate.reports', 'Generate Reports', 'Generate reports from analytics'),
    ('export.datasets', 'Export Datasets', 'Export analytical datasets'),
    ('read.only.dashboards', 'Read Only Dashboards', 'View dashboards in read-only mode')
) as p(code, name, description)
on conflict (organization_id, code) do update
set
  name = excluded.name,
  description = excluded.description,
  updated_at = now();

-- role -> permission matrix
with matrix as (
  select * from (
    values
      ('admin', 'manage.organizations'),
      ('admin', 'manage.facilities'),
      ('admin', 'manage.users'),
      ('admin', 'view.all.dashboards'),
      ('admin', 'manage.integrations'),
      ('admin', 'configure.alerts'),
      ('admin', 'view.executive.dashboards'),
      ('admin', 'view.financial.reports'),
      ('admin', 'view.operational.analytics'),
      ('admin', 'export.reports'),
      ('admin', 'view.clinical.dashboards'),
      ('admin', 'view.patient.data'),
      ('admin', 'view.treatment.outcomes'),
      ('admin', 'create.dashboards'),
      ('admin', 'run.analytics.queries'),
      ('admin', 'generate.reports'),
      ('admin', 'export.datasets'),
      ('admin', 'read.only.dashboards'),
      ('executive', 'view.executive.dashboards'),
      ('executive', 'view.financial.reports'),
      ('executive', 'view.operational.analytics'),
      ('executive', 'export.reports'),
      ('doctor', 'view.clinical.dashboards'),
      ('doctor', 'view.patient.data'),
      ('doctor', 'view.treatment.outcomes'),
      ('analyst', 'create.dashboards'),
      ('analyst', 'run.analytics.queries'),
      ('analyst', 'generate.reports'),
      ('analyst', 'export.datasets'),
      ('viewer', 'read.only.dashboards')
  ) as m(role_slug, permission_code)
)
insert into public.role_permissions (organization_id, role_id, permission_id)
select
  r.organization_id,
  r.id,
  p.id
from public.roles r
join public.permissions p
  on p.organization_id = r.organization_id
join matrix m
  on m.role_slug = r.slug
 and m.permission_code = p.code
on conflict (organization_id, role_id, permission_id) do nothing;

commit;
