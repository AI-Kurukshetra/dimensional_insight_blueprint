import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { checkAnyPermission, checkPermission } from "@/lib/checkPermission";
import { RBAC_PERMISSIONS } from "@/lib/rbac";

export async function GET(request: Request) {
  const permission = await checkPermission(RBAC_PERMISSIONS.viewOperationalAnalytics);
  if ("error" in permission) {
    return permission.error;
  }

  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get("limit") ?? 50);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 500)
    : 50;

  const { data, error } = await permission.supabase
    .from("activity_logs")
    .select("id, user_id, organization_id, action, resource_type, resource_id, metadata, created_at")
    .eq("organization_id", permission.organizationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
    supabase: permission.supabase,
    userId: permission.user.id,
    organizationId: permission.organizationId,
    action: "activity.view",
    resourceType: "activity_log",
    metadata: { limit }
  });

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const permission = await checkAnyPermission([
    RBAC_PERMISSIONS.manageUsers,
    RBAC_PERMISSIONS.createDashboards,
    RBAC_PERMISSIONS.generateReports,
    RBAC_PERMISSIONS.exportDatasets,
    RBAC_PERMISSIONS.exportReports
  ]);
  if ("error" in permission) {
    return permission.error;
  }

  const body = (await request.json()) as {
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
  };

  await logActivity({
    supabase: permission.supabase,
    userId: permission.user.id,
    organizationId: permission.organizationId,
    action: body.action,
    resourceType: body.resourceType,
    resourceId: body.resourceId ?? null,
    metadata: body.metadata ?? {}
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
