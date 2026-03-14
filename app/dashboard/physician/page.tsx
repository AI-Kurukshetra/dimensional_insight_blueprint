import { ModulePage } from "@/components/dashboard/module-page";
import { requireRole } from "@/lib/auth";

export default async function PhysicianDashboardPage() {
  await requireRole("physician");

  return (
    <ModulePage
      title="Physician Dashboard"
      description="Patient outcomes, readmission trends, diagnoses tracking, and lab surveillance in one clinical workspace."
      sections={[
        {
          title: "Patient outcomes",
          body: "Track readmission rates, discharge outcomes, and care quality measures.",
          badge: "Clinical"
        },
        {
          title: "Lab and diagnosis stream",
          body: "Monitor abnormal lab values and diagnosis distribution by patient cohort.",
          badge: "Realtime"
        }
      ]}
    />
  );
}
