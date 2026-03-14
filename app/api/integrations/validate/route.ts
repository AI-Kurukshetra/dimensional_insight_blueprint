import { NextResponse } from "next/server";
import { validateIncomingRecords } from "@/lib/integrations/validation";
import { resolveTenantContext } from "@/lib/api";

export async function POST(request: Request) {
  const context = await resolveTenantContext();
  if ("error" in context) {
    return context.error;
  }

  const body = (await request.json()) as { records: Array<Record<string, unknown>> };
  const results = validateIncomingRecords(body.records);

  await context.supabase.from("integration_logs").insert({
    organization_id: context.organizationId,
    facility_id: context.defaultFacilityId,
    connection_id: null,
    job_id: null,
    log_level: "info",
    message: "Integration payload validated",
    details: { total: body.records.length, valid: results.filter((item) => item.valid).length }
  } as any);

  return NextResponse.json({
    results
  });
}
