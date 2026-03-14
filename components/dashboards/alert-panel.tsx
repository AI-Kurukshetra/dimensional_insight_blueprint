import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AlertPanel({
  title,
  description,
  severity
}: {
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
}) {
  const tone =
    severity === "critical"
      ? "border-red-300 bg-red-50"
      : severity === "high"
        ? "border-amber-300 bg-amber-50"
        : "border-slate-200 bg-white";

  return (
    <Card className={tone}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4" />
          {title}
        </CardTitle>
        <CardDescription>{severity.toUpperCase()}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{description}</CardContent>
    </Card>
  );
}
