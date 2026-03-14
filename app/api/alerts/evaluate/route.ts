import { NextResponse } from "next/server";
import { alertEvaluationSchema, evaluateThresholdAlerts } from "@/lib/alerts";
import { sendAlertEmailNotification } from "@/lib/notifications";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { resolveTenantContext } from "@/lib/api";

export async function POST(request: Request) {
  const payload = alertEvaluationSchema.parse(await request.json());
  const alerts = evaluateThresholdAlerts(payload);

  if (alerts.length && hasSupabaseEnv()) {
    const context = await resolveTenantContext();
    if ("error" in context) {
      return context.error;
    }

    const supabase = context.supabase;
    await supabase.from("alerts").insert(
      alerts.map((alert) => ({
        organization_id: context.organizationId,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        module_name: alert.module,
        owner_name: "Automated Monitor",
        status: "new",
        alert_type: alert.module.toLowerCase()
      }))
    );

    await supabase.from("user_events").insert({
      organization_id: context.organizationId,
      user_id: context.user.id,
      event_type: "alert",
      event_name: "Alert Rule Evaluated",
      dashboard_slug: "alerts",
      payload: {
        created: alerts.length,
        readmissionRate: payload.readmissionRate ?? null,
        claimDenialRate: payload.claimDenialRate ?? null,
        bedAvailability: payload.bedAvailability ?? null,
        financialLosses: payload.financialLosses ?? null,
        abnormalLabCount: payload.abnormalLabCount ?? null
      },
      occurred_at: new Date().toISOString()
    } as any);
  }

  if (alerts.length) {
    await sendAlertEmailNotification({
      subject: "HealthScope alert triggered",
      message: alerts.map((alert) => `${alert.title}: ${alert.description}`).join("\n"),
      recipients: [process.env.ALERT_NOTIFICATION_EMAIL ?? "ops@healthscope.ai"]
    });
  }

  return NextResponse.json({
    created: alerts.length,
    alerts
  });
}
