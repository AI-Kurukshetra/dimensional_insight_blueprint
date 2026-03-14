import { ActivityFeed } from "@/components/dashboards/activity-feed";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { requireRole } from "@/lib/auth";

export default async function AdminDashboardPage() {
  await requireRole("admin");

  const metrics = [
    {
      id: "active-users",
      label: "Active users",
      value: "Live",
      change: "Realtime",
      direction: "up" as const,
      description: "Current connected users across dashboards"
    },
    {
      id: "open-alerts",
      label: "Open alerts",
      value: "Monitored",
      change: "Live feed",
      direction: "up" as const,
      description: "Clinical, financial, and system alerts"
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-semibold">Admin Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {metrics.map((metric) => (
          <KpiCard key={metric.id} metric={metric} />
        ))}
      </div>
      <ActivityFeed />
    </div>
  );
}
