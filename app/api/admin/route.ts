import { NextResponse } from "next/server";
import { resolveTenantContext } from "@/lib/api";

export async function GET() {
  const context = await resolveTenantContext();
  if ("error" in context) {
    return context.error;
  }

  if (context.role !== "admin") {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }

  const [users, activeUsers, alerts, integrations] = await Promise.all([
    context.supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", context.organizationId)
      .is("deleted_at", null),
    context.supabase
      .from("active_sessions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", context.organizationId)
      .eq("session_status", "active"),
    context.supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", context.organizationId)
      .eq("status", "new"),
    context.supabase
      .from("integration_connections")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", context.organizationId)
  ]);

  return NextResponse.json({
    users: users.count ?? 0,
    activeUsers: activeUsers.count ?? 0,
    newAlerts: alerts.count ?? 0,
    integrations: integrations.count ?? 0
  });
}
