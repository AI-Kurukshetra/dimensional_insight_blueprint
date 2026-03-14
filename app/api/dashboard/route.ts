import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { checkAnyPermission, checkPermission } from "@/lib/checkPermission";
import {
  RBAC_PERMISSIONS,
  canAccessDashboard,
  type DashboardScope
} from "@/lib/rbac";

const scopeToRoleSlugs: Record<DashboardScope, string[]> = {
  executive: ["executive", "admin"],
  clinical: ["doctor", "physician", "analyst", "admin"],
  financial: ["executive", "admin"],
  operational: ["executive", "admin"],
  "analytics-builder": ["analyst", "admin"]
};

const roleToDefaultDashboardSlugs: Record<string, string[] | null> = {
  admin: null,
  executive: ["executive"],
  doctor: ["doctor", "physician", "analyst"],
  analyst: ["analyst", "doctor", "physician"],
  viewer: ["executive", "analyst", "doctor", "physician"]
};

export async function GET(request: Request) {
  const permission = await checkAnyPermission([
    RBAC_PERMISSIONS.viewAllDashboards,
    RBAC_PERMISSIONS.viewExecutiveDashboards,
    RBAC_PERMISSIONS.viewClinicalDashboards,
    RBAC_PERMISSIONS.viewFinancialReports,
    RBAC_PERMISSIONS.readOnlyDashboards
  ]);
  if ("error" in permission) {
    return permission.error;
  }

  const { searchParams } = new URL(request.url);
  const requestedScope = searchParams.get("scope") as DashboardScope | null;

  if (requestedScope && !canAccessDashboard(permission.role, requestedScope)) {
    return NextResponse.json({ error: "Forbidden dashboard scope" }, { status: 403 });
  }

  let query = permission.supabase
    .from("dashboards")
    .select(
      "id, name, slug, status, role_slug, facility_id, dashboards_widgets:dashboard_widgets(id, title, widget_key, position, size)"
    )
    .eq("organization_id", permission.organizationId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (requestedScope) {
    query = query.in("role_slug", scopeToRoleSlugs[requestedScope]);
  } else {
    const allowedRoleSlugs = roleToDefaultDashboardSlugs[permission.role];
    if (allowedRoleSlugs && allowedRoleSlugs.length) {
      query = query.in("role_slug", allowedRoleSlugs);
    }
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
    supabase: permission.supabase,
    userId: permission.user.id,
    organizationId: permission.organizationId,
    action: "dashboard.view",
    resourceType: "dashboard",
    metadata: { scope: requestedScope ?? "all", count: data?.length ?? 0 }
  });

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const permission = await checkPermission(RBAC_PERMISSIONS.createDashboards);
  if ("error" in permission) {
    return permission.error;
  }

  const body = (await request.json()) as {
    name: string;
    slug: string;
    roleSlug: string;
    facilityId?: string | null;
    status?: string;
    layoutConfig?: Record<string, unknown>;
  };

  const { data, error } = await permission.supabase
    .from("dashboards")
    .insert({
      organization_id: permission.organizationId,
      name: body.name,
      slug: body.slug,
      role_slug: body.roleSlug,
      facility_id: body.facilityId ?? null,
      status: body.status ?? "active",
      layout_config: body.layoutConfig ?? {}
    } as any)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await logActivity({
    supabase: permission.supabase,
    userId: permission.user.id,
    organizationId: permission.organizationId,
    action: "dashboard.create",
    resourceType: "dashboard",
    resourceId: data.id as string,
    metadata: { slug: body.slug }
  });

  return NextResponse.json(data, { status: 201 });
}
