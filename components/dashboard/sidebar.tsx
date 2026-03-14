"use client";

import Link from "next/link";
import { Activity, AlertTriangle, Building2, ChartColumn, DatabaseZap, LayoutDashboard, Shield, Stethoscope, UsersRound, UserSquare2 } from "lucide-react";
import { usePermissions } from "@/hooks/usePermission";
import { RBAC_PERMISSIONS } from "@/lib/rbac";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, required: null },
  {
    href: "/dashboard/admin",
    label: "Admin Dashboard",
    icon: Shield,
    required: RBAC_PERMISSIONS.viewAllDashboards
  },
  {
    href: "/dashboard/executive",
    label: "Executive Dashboard",
    icon: Activity,
    required: RBAC_PERMISSIONS.viewExecutiveDashboards
  },
  {
    href: "/dashboard/physician",
    label: "Physician Dashboard",
    icon: Stethoscope,
    required: RBAC_PERMISSIONS.viewClinicalDashboards
  },
  {
    href: "/dashboard/analyst",
    label: "Analyst Dashboard",
    icon: ChartColumn,
    required: RBAC_PERMISSIONS.runAnalyticsQueries
  },
  {
    href: "/dashboard/clinical",
    label: "Clinical",
    icon: Stethoscope,
    required: RBAC_PERMISSIONS.viewClinicalDashboards
  },
  {
    href: "/dashboard/financial",
    label: "Financial",
    icon: ChartColumn,
    required: RBAC_PERMISSIONS.viewFinancialReports
  },
  {
    href: "/dashboard/operational",
    label: "Operational",
    icon: Activity,
    required: RBAC_PERMISSIONS.viewOperationalAnalytics
  },
  {
    href: "/dashboard/population",
    label: "Population",
    icon: UsersRound,
    required: RBAC_PERMISSIONS.runAnalyticsQueries
  },
  {
    href: "/dashboard/data",
    label: "Patients & Providers",
    icon: UserSquare2,
    required: RBAC_PERMISSIONS.viewPatientData
  },
  {
    href: "/dashboard/alerts",
    label: "Alerts",
    icon: AlertTriangle,
    required: RBAC_PERMISSIONS.configureAlerts
  },
  {
    href: "/dashboard/integrations",
    label: "Integration Hub",
    icon: DatabaseZap,
    required: RBAC_PERMISSIONS.manageIntegrations
  },
  {
    href: "/dashboard/organizations",
    label: "Organizations",
    icon: Building2,
    required: RBAC_PERMISSIONS.manageOrganizations
  },
  { href: "/admin/users", label: "Admin Panel", icon: Shield, required: RBAC_PERMISSIONS.manageUsers }
];

export function DashboardSidebar() {
  const { hasPermission, loading } = usePermissions();

  const visibleItems = items.filter((item) => {
    if (!item.required) {
      return true;
    }
    return hasPermission(item.required);
  });

  return (
    <aside className="hidden w-72 shrink-0 border-r border-sidebar-border bg-sidebar px-5 py-6 text-sidebar-foreground lg:block">
      <div className="mb-8">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sidebar-primary">
          HealthScope
        </div>
        <div className="mt-2 text-2xl font-semibold">Analytics Suite</div>
        <p className="mt-2 text-sm text-slate-300">
          Multi-tenant healthcare intelligence for clinical, financial, and population teams.
        </p>
      </div>

      <nav className="space-y-1">
        {(loading ? items.slice(0, 6) : visibleItems).map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-sidebar-accent hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
