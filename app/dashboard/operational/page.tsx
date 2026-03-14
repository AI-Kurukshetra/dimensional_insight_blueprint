import { OperationalDashboard } from "@/components/dashboard/operational-dashboard";
import { requireRole } from "@/lib/auth";

export default async function OperationalPage() {
  await requireRole("executive");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold">Operational Dashboard</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Facility throughput, bed utilization, wait-time, and staffing performance monitoring.
        </p>
      </div>
      <OperationalDashboard />
    </div>
  );
}
