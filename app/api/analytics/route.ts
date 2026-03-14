import { NextResponse } from "next/server";
import { resolveTenantContext } from "@/lib/api";
import { getAnalyticsSummary } from "@/services/analytics";

export async function GET() {
  const context = await resolveTenantContext();
  if ("error" in context) {
    return context.error;
  }

  const summary = await getAnalyticsSummary(context.organizationId);

  const [{ data: activeSessions }, { data: dashboardViews }] = await Promise.all([
    context.supabase
      .from("active_sessions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", context.organizationId)
      .eq("session_status", "active"),
    context.supabase
      .from("dashboard_views")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", context.organizationId)
  ]);

  return NextResponse.json({
    ...summary,
    activeUsers: activeSessions.count ?? 0,
    dashboardViews: dashboardViews.count ?? 0
  });
}
