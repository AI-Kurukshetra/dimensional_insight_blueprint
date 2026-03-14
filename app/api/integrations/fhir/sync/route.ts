import { NextResponse } from "next/server";
import { buildConnectorJob } from "@/lib/integrations/connectors";
import { resolveTenantContext } from "@/lib/api";

export async function POST(request: Request) {
  const context = await resolveTenantContext();
  if ("error" in context) {
    return context.error;
  }

  const payload = await request.json();
  const job = buildConnectorJob("fhir", {
    ...payload,
    organizationId: context.organizationId
  });

  const { data: persisted } = await context.supabase
    .from("integration_jobs")
    .insert({
      organization_id: context.organizationId,
      facility_id: context.defaultFacilityId,
      connection_id: null,
      connector_type: "fhir",
      job_name: `FHIR ${job.normalizedTarget ?? "sync"}`,
      status: job.status,
      started_at: new Date().toISOString(),
      payload: payload
    } as any)
    .select("*")
    .single();

  await context.supabase.from("user_events").insert({
    organization_id: context.organizationId,
    user_id: context.user.id,
    event_type: "integration_job",
    event_name: "FHIR Sync Triggered",
    dashboard_slug: "integrations",
    payload: { jobId: persisted?.id ?? null },
    occurred_at: new Date().toISOString()
  } as any);

  return NextResponse.json({
    ...job,
    id: persisted?.id ?? null
  });
}
