import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { KpiMetric } from "@/lib/types";

export function KpiCard({ metric }: { metric: KpiMetric }) {
  const positive = metric.direction === "up";

  return (
    <Card className="border-0 bg-white/90 shadow-lg shadow-slate-200/60">
      <CardHeader className="pb-3">
        <CardDescription>{metric.label}</CardDescription>
        <CardTitle className="text-3xl">{metric.value}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
            positive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
          }`}
        >
          {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {metric.change}
        </div>
        <p className="text-sm text-muted-foreground">{metric.description}</p>
      </CardContent>
    </Card>
  );
}
