import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AlertItem } from "@/lib/types";

function severityVariant(severity: AlertItem["severity"]) {
  switch (severity) {
    case "critical":
    case "high":
      return "destructive";
    case "medium":
      return "warning";
    default:
      return "success";
  }
}

export function AlertsList({ alerts }: { alerts: AlertItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-time alerts</CardTitle>
        <CardDescription>
          Signal queue for anomalies, financial thresholds, and integration events.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert, index) => (
          <div key={alert.id}>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{alert.title}</h4>
                  <Badge variant={severityVariant(alert.severity)}>{alert.severity}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{alert.description}</p>
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {alert.module} • {alert.owner}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">{new Date(alert.timestamp).toLocaleString()}</div>
            </div>
            {index < alerts.length - 1 ? <Separator className="mt-4" /> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
