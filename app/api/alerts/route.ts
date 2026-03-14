import { NextResponse } from "next/server";
import { demoOverview } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { resolveTenantContext } from "@/lib/api";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(demoOverview.alerts);
  }

  const context = await resolveTenantContext();
  if ("error" in context) {
    return context.error;
  }

  const { data, error } = await context.supabase
    .from("alerts")
    .select("*")
    .eq("organization_id", context.organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json(demoOverview.alerts);
  }

  return NextResponse.json(
    data.map((alert: any) => ({
      id: alert.id,
      organizationId: alert.organization_id,
      facilityId: alert.facility_id ?? undefined,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      status: alert.status,
      owner: alert.owner_name,
      timestamp: alert.created_at,
      module: alert.module_name
    }))
  );
}
