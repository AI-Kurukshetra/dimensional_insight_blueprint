# HealthScope Analytics Suite - Production Implementation

This repository contains a production-ready multi-tenant Healthcare Analytics BI platform built on:

- Frontend: Next.js App Router + TypeScript + TailwindCSS + shadcn/ui
- Backend: Next.js Route Handlers (`app/api/**`)
- Database/Auth: Supabase PostgreSQL + Supabase Auth
- Storage: Amazon S3 (presigned URLs)
- Charts: Recharts
- State: React Query
- Deployment: Vercel

## 1) Full folder structure

- Full project file map (excluding `.next` and `node_modules`): [folder-structure.txt](/home/oem/Rashmi/healthcare/docs/folder-structure.txt)
- Core directories:
  - `app/` - UI routes + API route handlers
  - `components/` - shadcn/ui + dashboard widgets/charts/tables
  - `lib/` - auth, RBAC, Supabase clients, S3, tenant context
  - `services/` - analytics/EHR/reporting service logic
  - `supabase/` - authoritative schema, seeds, migrations
  - `database/` - mirrored schema/seed output for portability
  - `scripts/` - demo and healthcare data seed/activity scripts

## 2) Package dependencies

See [package.json](/home/oem/Rashmi/healthcare/package.json). Key runtime dependencies:

- `next`, `react`, `react-dom`, `typescript`
- `@supabase/supabase-js`, `@supabase/ssr`
- `@tanstack/react-query`
- `recharts`, `d3`
- `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
- `class-variance-authority`, `clsx`, `tailwind-merge`, `tailwindcss-animate`
- `@radix-ui/*` (via shadcn/ui components)

## 3) Environment variables

Source: [.env.example](/home/oem/Rashmi/healthcare/.env.example)

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000

AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

ALERT_EMAIL_WEBHOOK_URL=
ALERT_NOTIFICATION_EMAIL=
```

## 4) Database schema

Primary schema: [supabase/schema.sql](/home/oem/Rashmi/healthcare/supabase/schema.sql)

Warehouse and platform domains implemented:

- Multi-tenant core: `organizations`, `facilities`, `profiles`, `organization_memberships`, `organization_members`
- RBAC: `roles`, `permissions`, `role_permissions`, `users`, `user_roles`
- User/session/activity: `user_sessions`, `user_activity_logs`, `active_sessions`, `user_events`
- BI dashboard builder: `dashboards`, `widget_types`, `dashboard_widgets`, `widget_configurations`, `dashboard_views`
- Clinical model: `patients`, `providers`, `clinical_encounters`, `diagnoses`, `procedures`, `medications`, `lab_results`, `vital_signs`
- Financial/quality: `insurance_claims`, `financial_transactions`, `financial_metrics`, `quality_measures`, `clinical_metrics`
- Alerts/reporting/integration: `alerts`, `alert_rules`, `alert_subscriptions`, `alert_events`, `reports`, `report_templates`, `report_exports`, `data_sources`, `integration_connections`, `integration_jobs`, `integration_logs`

## 5) Supabase setup

1. Create Supabase project.
2. Copy env values into `.env.local`.
3. Run SQL in Supabase SQL Editor:
   - [supabase/schema.sql](/home/oem/Rashmi/healthcare/supabase/schema.sql)
   - [supabase/seed.sql](/home/oem/Rashmi/healthcare/supabase/seed.sql)
4. Optional: run incremental SQL under [supabase/migrations](/home/oem/Rashmi/healthcare/supabase/migrations).
5. Auth callback route is implemented at [route.ts](/home/oem/Rashmi/healthcare/app/auth/callback/route.ts).

## 6) API routes

Implemented under `app/api/**`:

- Core: `/api/auth`, `/api/users`, `/api/organizations`, `/api/facilities`, `/api/patients`, `/api/providers`
- Analytics: `/api/analytics`, `/api/dashboard`, `/api/dashboards`, `/api/activity`
- Alerts/Reports: `/api/alerts`, `/api/alerts/evaluate`, `/api/reports`, `/api/reports/export`, `/api/reports/schedule`
- Integrations: `/api/integrations`, `/api/integrations/validate`, `/api/integrations/fhir/*`, `/api/integrations/epic/sync`, `/api/integrations/cerner/sync`
- Admin/security: `/api/admin`, `/api/admin/activity`, `/api/roles`, `/api/permissions`, `/api/setup-user`

## 7) Authentication system

- Supabase session auth integrated in server + middleware clients:
  - [server.ts](/home/oem/Rashmi/healthcare/lib/supabase/server.ts)
  - [middleware.ts](/home/oem/Rashmi/healthcare/lib/supabase/middleware.ts)
- Tenant + role enforcement:
  - [middleware.ts](/home/oem/Rashmi/healthcare/middleware.ts)
  - [auth.ts](/home/oem/Rashmi/healthcare/lib/auth.ts)
  - [rbac.ts](/home/oem/Rashmi/healthcare/lib/rbac.ts)
- Login/signup/auth pages:
  - [page.tsx](/home/oem/Rashmi/healthcare/app/login/page.tsx)
  - [page.tsx](/home/oem/Rashmi/healthcare/app/signup/page.tsx)
  - [page.tsx](/home/oem/Rashmi/healthcare/app/auth/page.tsx)

## 8) Dashboard UI

Role-focused dashboards are implemented:

- Main shell/layout: [layout.tsx](/home/oem/Rashmi/healthcare/app/dashboard/layout.tsx)
- Executive: [page.tsx](/home/oem/Rashmi/healthcare/app/dashboard/executive/page.tsx)
- Financial: [page.tsx](/home/oem/Rashmi/healthcare/app/dashboard/financial/page.tsx)
- Operational: [page.tsx](/home/oem/Rashmi/healthcare/app/dashboard/operational/page.tsx)
- Clinical/Population/Analyst/Physician/Admin variants under `app/dashboard/**`
- Widgets/charts:
  - [executive-dashboard.tsx](/home/oem/Rashmi/healthcare/components/dashboard/executive-dashboard.tsx)
  - [clinical-dashboard.tsx](/home/oem/Rashmi/healthcare/components/dashboard/clinical-dashboard.tsx)
  - [revenue-chart.tsx](/home/oem/Rashmi/healthcare/components/charts/revenue-chart.tsx)
  - [quality-sparkline.tsx](/home/oem/Rashmi/healthcare/components/charts/quality-sparkline.tsx)

## 9) Example analytics queries

Use organization-scoped SQL to preserve tenant isolation.

```sql
-- 1) 30-day encounter trend by facility
select
  facility_id,
  date_trunc('day', encounter_date)::date as day,
  count(*) as encounters
from public.clinical_encounters
where organization_id = $1
  and encounter_date >= now() - interval '30 days'
group by facility_id, day
order by day asc;

-- 2) Readmission rate proxy (encounters within 30 days for same patient)
with ordered as (
  select
    patient_id,
    organization_id,
    encounter_date,
    lag(encounter_date) over (partition by organization_id, patient_id order by encounter_date) as prev_encounter_date
  from public.clinical_encounters
  where organization_id = $1
)
select
  count(*) filter (where prev_encounter_date is not null and encounter_date - prev_encounter_date <= interval '30 days')::numeric
  / nullif(count(*) filter (where prev_encounter_date is not null), 0) as readmission_rate_30d
from ordered;

-- 3) Payer mix and denial rate
select
  payer_name,
  count(*) as total_claims,
  count(*) filter (where claim_status = 'denied') as denied_claims,
  round(
    100.0 * count(*) filter (where claim_status = 'denied')
    / nullif(count(*), 0), 2
  ) as denial_rate_pct
from public.insurance_claims
where organization_id = $1
group by payer_name
order by total_claims desc;
```

## 10) Deployment steps (Vercel)

1. Push repo to Git provider.
2. Import project in Vercel.
3. Set all env vars from `.env.example` in Vercel Project Settings.
4. Ensure Supabase URL/keys are production values and S3 credentials point to production bucket.
5. Build command: `npm run build`; output handled by Next.js.
6. Deploy.
7. Validate post-deploy:
   - Auth login/signup
   - Tenant routing (`/dashboard`, `/admin`)
   - API routes under `/api/*`
   - Report export/S3 signed URL flows

## Run locally

```bash
npm install
npm run dev
```

Validated in this workspace:

- `npm install` completed successfully.
- `npm run dev` starts Next.js on `http://localhost:3000`.
- `npm run typecheck` passes.
- `npm run lint` passes.
