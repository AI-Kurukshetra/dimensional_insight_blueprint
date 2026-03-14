import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { checkAnyPermission } from "@/lib/checkPermission";
import { RBAC_PERMISSIONS } from "@/lib/rbac";
import { getReportCatalog } from "@/services/reports";

export async function GET() {
  const permission = await checkAnyPermission([
    RBAC_PERMISSIONS.viewFinancialReports,
    RBAC_PERMISSIONS.generateReports,
    RBAC_PERMISSIONS.exportReports
  ]);
  if ("error" in permission) {
    return permission.error;
  }

  const reports = await getReportCatalog(permission.organizationId);
  await logActivity({
    supabase: permission.supabase,
    userId: permission.user.id,
    organizationId: permission.organizationId,
    action: "reports.view",
    resourceType: "report",
    metadata: { count: reports.length }
  });

  return NextResponse.json(reports);
}
