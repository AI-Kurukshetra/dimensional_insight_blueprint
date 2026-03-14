import { ClinicalDashboard } from "@/components/dashboard/clinical-dashboard";
import { requireRole } from "@/lib/auth";

export default async function ClinicalPage() {
  await requireRole("doctor");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold">Clinical Dashboard</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Patient outcomes, diagnoses, and care-delivery KPIs with chart and table views.
        </p>
      </div>
      <ClinicalDashboard />
    </div>
  );
}
