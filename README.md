# HealthScope Analytics Suite

Production-ready multi-tenant healthcare analytics platform built with Next.js 14, TypeScript, TailwindCSS, shadcn/ui, Supabase, React Query, Zustand, Recharts, D3, and AWS S3 integration.

Detailed architecture and implementation deliverables (folder structure, schema, API map, auth model, analytics SQL, deployment) are documented in [docs/IMPLEMENTATION.md](/home/oem/Rashmi/healthcare/docs/IMPLEMENTATION.md).

## Core capabilities

- Multi-tenant organizations with facility-level segmentation
- RBAC with `admin`, `executive`, `physician`, `analyst`
- Supabase Auth + tenant-aware middleware and route protection
- Real-time user tracking with Supabase Realtime (`active_sessions`, `user_events`, `dashboard_views`)
- Configurable dashboard builder tables (`dashboards`, `dashboard_widgets`, `widget_types`, `widget_configurations`)
- Healthcare analytics data model (patients, providers, encounters, diagnoses, labs, vitals, claims, finance, quality)
- Alerting system (rules, subscriptions, events)
- Reporting system with S3 export scaffolding
- EHR integration hub (FHIR, Epic, Cerner connectors + jobs/logs)
- Admin panel pages (`/admin/users`, `/admin/roles`, `/admin/facilities`, `/admin/dashboards`, `/admin/integrations`, `/admin/settings`)

## Tech stack

- Next.js 14 App Router + TypeScript
- TailwindCSS + shadcn/ui
- Supabase (PostgreSQL + Auth + Realtime)
- AWS S3
- React Query
- Zustand
- Recharts + D3
- Vercel deployment

## Project structure

```text
app/
  admin/
    users/
    roles/
    facilities/
    dashboards/
    integrations/
    settings/
  analytics/
  reports/
  alerts/
  settings/
  dashboard/
    admin/
    executive/
    physician/
    analyst/
  api/
    auth/
    users/
    organizations/
    facilities/
    patients/
    providers/
    analytics/
    dashboards/
    reports/
    alerts/
    integrations/
    admin/
components/
  charts/
  dashboard/
  dashboards/
  tables/
  ui/
lib/
  supabase/
  auth.ts
  api.ts
  activity.ts
services/
  analytics/
  ehr/
  reports/
store/
supabase/
  schema.sql
  seed.sql
database/
  schema.sql
  seed.sql
```

## Database output

Primary schema and seed files:

- [`supabase/schema.sql`](/home/oem/Rashmi/healthcare/supabase/schema.sql)
- [`supabase/seed.sql`](/home/oem/Rashmi/healthcare/supabase/seed.sql)

Mirrored output for documentation/import workflows:

- [`database/schema.sql`](/home/oem/Rashmi/healthcare/database/schema.sql)
- [`database/seed.sql`](/home/oem/Rashmi/healthcare/database/seed.sql)

The schema includes all requested domains:

- Multi-tenant tables: `organizations`, `facilities`, `users`, `organization_settings`
- RBAC: `roles`, `permissions`, `role_permissions`, `user_roles`
- User management: `user_sessions`, `user_activity_logs`, `user_facility_access`
- Realtime tracking: `active_sessions`, `user_events`, `dashboard_views`
- Dashboard builder: `dashboards`, `dashboard_widgets`, `widget_types`, `widget_configurations`
- Analytics data: `patients`, `providers`, `clinical_encounters`, `diagnoses`, `procedures`, `medications`, `lab_results`, `vital_signs`, `insurance_claims`, `financial_transactions`, `quality_measures`
- Alerts: `alerts`, `alert_rules`, `alert_subscriptions`, `alert_events`
- Reporting: `reports`, `report_templates`, `report_exports`
- Integration hub: `data_sources`, `integration_connections`, `integration_jobs`, `integration_logs`

All major tables include `organization_id`, `created_at`, `updated_at`, and `deleted_at`.

## API routes

Generated and implemented:

- `/api/auth`
- `/api/users`
- `/api/organizations`
- `/api/facilities`
- `/api/patients`
- `/api/providers`
- `/api/analytics`
- `/api/dashboards`
- `/api/reports`
- `/api/alerts`
- `/api/integrations`
- `/api/admin`

Additional route handlers included for workflows:

- `/api/admin/activity`
- `/api/reports/export`
- `/api/reports/schedule`
- `/api/alerts/evaluate`
- `/api/integrations/fhir/sync`
- `/api/integrations/epic/sync`
- `/api/integrations/cerner/sync`
- `/api/integrations/validate`

## Environment configuration

Use `.env.local`:

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

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Set environment variables:

```bash
cp .env.example .env.local
```

3. In Supabase SQL editor run:

- [`supabase/schema.sql`](/home/oem/Rashmi/healthcare/supabase/schema.sql)
- [`supabase/seed.sql`](/home/oem/Rashmi/healthcare/supabase/seed.sql)

4. Start development server:

```bash
npm run dev
```

App default URL:

- `http://localhost:3000`

## Deployment

Deploy on Vercel with the same environment variables configured in project settings.
