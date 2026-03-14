import { FinancialDashboard } from "@/components/dashboard/financial-dashboard";
import { requireRole } from "@/lib/auth";

export default async function FinancialPage() {
  await requireRole("executive");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold">Financial Dashboard</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Revenue cycle performance, claim outcomes, and cost analytics.
        </p>
      </div>
      <FinancialDashboard />
    </div>
  );
}
