import type { AppRole } from "@/lib/types";

export type NormalizedRole = "admin" | "executive" | "doctor" | "analyst" | "viewer";

export const RBAC_PERMISSIONS = {
  manageOrganizations: "manage.organizations",
  manageFacilities: "manage.facilities",
  manageUsers: "manage.users",
  viewAllDashboards: "view.all.dashboards",
  manageIntegrations: "manage.integrations",
  configureAlerts: "configure.alerts",
  viewExecutiveDashboards: "view.executive.dashboards",
  viewFinancialReports: "view.financial.reports",
  viewOperationalAnalytics: "view.operational.analytics",
  exportReports: "export.reports",
  viewClinicalDashboards: "view.clinical.dashboards",
  viewPatientData: "view.patient.data",
  viewTreatmentOutcomes: "view.treatment.outcomes",
  createDashboards: "create.dashboards",
  runAnalyticsQueries: "run.analytics.queries",
  generateReports: "generate.reports",
  exportDatasets: "export.datasets",
  readOnlyDashboards: "read.only.dashboards"
} as const;

export type PermissionName = (typeof RBAC_PERMISSIONS)[keyof typeof RBAC_PERMISSIONS];

export type DashboardScope =
  | "executive"
  | "clinical"
  | "financial"
  | "operational"
  | "analytics-builder";

const ROLE_PERMISSION_MAP: Record<NormalizedRole, PermissionName[]> = {
  admin: Object.values(RBAC_PERMISSIONS),
  executive: [
    RBAC_PERMISSIONS.viewExecutiveDashboards,
    RBAC_PERMISSIONS.viewFinancialReports,
    RBAC_PERMISSIONS.viewOperationalAnalytics,
    RBAC_PERMISSIONS.exportReports
  ],
  doctor: [
    RBAC_PERMISSIONS.viewClinicalDashboards,
    RBAC_PERMISSIONS.viewPatientData,
    RBAC_PERMISSIONS.viewTreatmentOutcomes
  ],
  analyst: [
    RBAC_PERMISSIONS.createDashboards,
    RBAC_PERMISSIONS.runAnalyticsQueries,
    RBAC_PERMISSIONS.generateReports,
    RBAC_PERMISSIONS.exportDatasets,
    RBAC_PERMISSIONS.viewClinicalDashboards,
    RBAC_PERMISSIONS.viewPatientData,
    RBAC_PERMISSIONS.viewTreatmentOutcomes
  ],
  viewer: [RBAC_PERMISSIONS.readOnlyDashboards]
};

const roleRank: Record<NormalizedRole, number> = {
  viewer: 0,
  analyst: 1,
  doctor: 2,
  executive: 3,
  admin: 4
};

const dashboardAccess: Record<DashboardScope, NormalizedRole[]> = {
  executive: ["executive", "admin"],
  clinical: ["doctor", "analyst", "admin"],
  financial: ["executive", "admin"],
  operational: ["executive", "admin"],
  "analytics-builder": ["analyst", "admin"]
};

export function normalizeRole(role?: string | null): NormalizedRole | null {
  if (!role) {
    return null;
  }

  const normalized = role.toLowerCase();
  if (normalized === "physician") {
    return "doctor";
  }
  if (
    normalized === "admin" ||
    normalized === "executive" ||
    normalized === "doctor" ||
    normalized === "analyst" ||
    normalized === "viewer"
  ) {
    return normalized;
  }

  return null;
}

export function getPermissionsForRole(role?: string | null): PermissionName[] {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) {
    return [];
  }
  return ROLE_PERMISSION_MAP[normalizedRole];
}

export function hasPermission(role: string | null | undefined, permission: PermissionName) {
  return getPermissionsForRole(role).includes(permission);
}

export function hasAnyPermission(
  role: string | null | undefined,
  permissions: PermissionName[]
) {
  const granted = new Set(getPermissionsForRole(role));
  return permissions.some((permission) => granted.has(permission));
}

export function canAccessDashboard(role: string | null | undefined, scope: DashboardScope) {
  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) {
    return false;
  }
  return dashboardAccess[scope].includes(normalizedRole);
}

// Backward-compatible rank-based guard used in existing dashboard checks.
export function canAccess(required: AppRole, current?: AppRole | null) {
  const currentRole = normalizeRole(current);
  const requiredRole = normalizeRole(required);
  if (!currentRole || !requiredRole) {
    return false;
  }

  return roleRank[currentRole] >= roleRank[requiredRole];
}
