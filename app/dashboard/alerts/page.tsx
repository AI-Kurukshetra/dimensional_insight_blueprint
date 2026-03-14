import { RealtimeAlertPanel } from "@/components/dashboard/realtime-alert-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Real-time alerting system</CardTitle>
          <CardDescription>
            Alerts trigger on readmission rate thresholds, financial loss thresholds, and abnormal lab values. Supabase Realtime subscriptions provide websocket-backed updates when configured.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Email notifications are dispatched through a configurable webhook target when `ALERT_EMAIL_WEBHOOK_URL` is present.
        </CardContent>
      </Card>
      <RealtimeAlertPanel />
    </div>
  );
}
