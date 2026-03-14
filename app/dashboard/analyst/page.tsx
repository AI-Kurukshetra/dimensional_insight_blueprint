import { ModulePage } from "@/components/dashboard/module-page";
import { requireRole } from "@/lib/auth";

export default async function AnalystDashboardPage() {
  await requireRole("analyst");

  return (
    <ModulePage
      title="Analyst Dashboard"
      description="Population health analytics, cohort segmentation, and configurable reporting pipelines."
      sections={[
        {
          title: "Population health",
          body: "View cohort-level performance, completion rates, and risk stratification.",
          badge: "Population"
        },
        {
          title: "Predictive analytics",
          body: "Run model-backed trend analysis and scenario simulations for operations.",
          badge: "Analytics"
        }
      ]}
    />
  );
}
