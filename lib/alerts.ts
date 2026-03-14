import { z } from "zod";

export const alertEvaluationSchema = z.object({
  organizationId: z.string(),
  readmissionRate: z.number().optional(),
  claimDenialRate: z.number().optional(),
  bedAvailability: z.number().optional(),
  financialLosses: z.number().optional(),
  abnormalLabCount: z.number().optional()
});

export function evaluateThresholdAlerts(input: z.infer<typeof alertEvaluationSchema>) {
  const alerts: Array<{
    title: string;
    description: string;
    severity: "high" | "critical";
    module: string;
  }> = [];

  if ((input.readmissionRate ?? 0) > 0.12) {
    alerts.push({
      title: "High readmission rate detected",
      description: `Readmission rate reached ${(input.readmissionRate ?? 0) * 100}% for the monitored cohort.`,
      severity: "high",
      module: "Clinical"
    });
  }

  if ((input.claimDenialRate ?? 0) > 0.1) {
    alerts.push({
      title: "Claim denial rate threshold exceeded",
      description: `Claim denial rate is ${(input.claimDenialRate ?? 0) * 100}% and requires financial review.`,
      severity: "critical",
      module: "Financial"
    });
  }

  if ((input.bedAvailability ?? 1) < 0.2) {
    alerts.push({
      title: "Low bed availability warning",
      description: `Bed availability dropped to ${Math.round((input.bedAvailability ?? 0) * 100)}%.`,
      severity: "high",
      module: "Operational"
    });
  }

  if ((input.financialLosses ?? 0) > 250000) {
    alerts.push({
      title: "Financial losses exceeded threshold",
      description: `Financial loss monitoring detected $${input.financialLosses?.toLocaleString()} in thresholded exposure.`,
      severity: "critical",
      module: "Financial"
    });
  }

  if ((input.abnormalLabCount ?? 0) > 10) {
    alerts.push({
      title: "Abnormal lab values detected",
      description: `${input.abnormalLabCount} abnormal lab results were flagged in the most recent monitoring window.`,
      severity: "high",
      module: "Clinical"
    });
  }

  return alerts;
}
