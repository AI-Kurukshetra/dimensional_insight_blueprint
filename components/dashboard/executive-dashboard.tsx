"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { KpiMetric } from "@/lib/types";

const executiveKpis: KpiMetric[] = [
  {
    id: "exec-total-patients",
    label: "Patient Count",
    value: "24,860",
    change: "+4.2%",
    direction: "up",
    description: "Total active patients across all facilities"
  },
  {
    id: "exec-revenue",
    label: "Total Revenue",
    value: "$18.7M",
    change: "+2.8%",
    direction: "up",
    description: "Month-to-date recognized revenue"
  },
  {
    id: "exec-readmission",
    label: "Readmission Rate",
    value: "9.3%",
    change: "-0.6 pts",
    direction: "down",
    description: "30-day all-cause readmission rate"
  },
  {
    id: "exec-bed-utilization",
    label: "Bed Utilization",
    value: "81%",
    change: "+1.1%",
    direction: "up",
    description: "Average utilization across inpatient units"
  }
];

const trendData = [
  { month: "Jan", patientCount: 23210, revenueM: 16.1 },
  { month: "Feb", patientCount: 23580, revenueM: 16.6 },
  { month: "Mar", patientCount: 24110, revenueM: 17.2 },
  { month: "Apr", patientCount: 24540, revenueM: 17.8 },
  { month: "May", patientCount: 24860, revenueM: 18.7 }
];

const divisionRevenueData = [
  { division: "Cardiology", revenueM: 5.7 },
  { division: "Neurology", revenueM: 4.1 },
  { division: "Emergency", revenueM: 3.8 },
  { division: "Outpatient", revenueM: 5.1 }
];

const executiveTableRows = [
  { metric: "Claim Approval Rate", value: "89%", target: ">= 90%", status: "At Risk" },
  { metric: "Average Wait Time", value: "26 mins", target: "<= 30 mins", status: "On Track" },
  { metric: "Staff Productivity", value: "83%", target: ">= 80%", status: "On Track" },
  { metric: "Average Length of Stay", value: "4.4 days", target: "<= 4.8", status: "On Track" }
];

export function ExecutiveDashboard() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {executiveKpis.map((metric) => (
          <KpiCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance Trend</CardTitle>
            <CardDescription>Patient growth and revenue progression.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="patientCount" stroke="#0f766e" strokeWidth={3} />
                <Line yAxisId="right" type="monotone" dataKey="revenueM" stroke="#0284c7" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Division</CardTitle>
            <CardDescription>Executive comparison across service lines.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={divisionRevenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="division" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="revenueM" fill="#0f766e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Executive KPI Status Table</CardTitle>
          <CardDescription>Tracked against board-approved targets.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Metric</th>
                <th className="px-3 py-2 font-medium">Current</th>
                <th className="px-3 py-2 font-medium">Target</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {executiveTableRows.map((row) => (
                <tr key={row.metric} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-medium">{row.metric}</td>
                  <td className="px-3 py-2">{row.value}</td>
                  <td className="px-3 py-2">{row.target}</td>
                  <td className="px-3 py-2">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
