import { NextResponse } from "next/server";
import { resolveTenantContext } from "@/lib/api";
import { getIntegrationStatus } from "@/services/ehr";

export async function GET() {
  const context = await resolveTenantContext();
  if ("error" in context) {
    return context.error;
  }

  const connections = await getIntegrationStatus(context.organizationId);
  return NextResponse.json(connections);
}
