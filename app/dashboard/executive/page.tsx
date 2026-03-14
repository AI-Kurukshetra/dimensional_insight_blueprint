import { ExecutiveDashboard } from "@/components/dashboard/executive-dashboard";
import { requireRole } from "@/lib/auth";

export default async function ExecutivePage() {
  await requireRole("executive");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold">Executive Dashboard</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Enterprise healthcare analytics with KPI cards, trends, and board-level performance tables.
        </p>
      </div>
      <ExecutiveDashboard />
    </div>
  );
}
