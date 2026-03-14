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

const operationalKpis: KpiMetric[] = [
  {
    id: "ops-bed-utilization",
    label: "Bed Utilization",
    value: "81%",
    change: "+1.5%",
    direction: "up",
    description: "Average occupancy across monitored facilities"
  },
  {
    id: "ops-wait-time",
    label: "Average Wait Time",
    value: "26 mins",
    change: "-4 mins",
    direction: "down",
    description: "Median time from arrival to clinical triage"
  },
  {
    id: "ops-staff-productivity",
    label: "Staff Productivity",
    value: "83%",
    change: "+2.1%",
    direction: "up",
    description: "Productive clinical staffing utilization"
  }
];

const bedTrendData = [
  { day: "Mon", utilization: 78, waitTime: 31 },
  { day: "Tue", utilization: 80, waitTime: 29 },
  { day: "Wed", utilization: 82, waitTime: 28 },
  { day: "Thu", utilization: 83, waitTime: 26 },
  { day: "Fri", utilization: 81, waitTime: 25 }
];

const productivityData = [
  { unit: "Cardiology", productivity: 86 },
  { unit: "Neurology", productivity: 81 },
  { unit: "Emergency", productivity: 79 }
];

const opsTableRows = [
  { facility: "River Valley Main Hospital", bedAvailability: "19%", waitTime: "24 mins", productivity: "84%" },
  { facility: "Evergreen Diagnostic Center", bedAvailability: "27%", waitTime: "18 mins", productivity: "82%" }
];

export function OperationalDashboard() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {operationalKpis.map((metric) => (
          <KpiCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bed Utilization and Wait Time</CardTitle>
            <CardDescription>Daily operations trend by facility group.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bedTrendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="utilization" stroke="#0f766e" strokeWidth={3} />
                <Line yAxisId="right" type="monotone" dataKey="waitTime" stroke="#0284c7" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Staff Productivity by Unit</CardTitle>
            <CardDescription>Operational productivity performance.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productivityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="unit" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="productivity" fill="#0f766e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Operational Facility Table</CardTitle>
          <CardDescription>Bed availability and staffing overview.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Facility</th>
                <th className="px-3 py-2 font-medium">Bed Availability</th>
                <th className="px-3 py-2 font-medium">Average Wait Time</th>
                <th className="px-3 py-2 font-medium">Staff Productivity</th>
              </tr>
            </thead>
            <tbody>
              {opsTableRows.map((row) => (
                <tr key={row.facility} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-medium">{row.facility}</td>
                  <td className="px-3 py-2">{row.bedAvailability}</td>
                  <td className="px-3 py-2">{row.waitTime}</td>
                  <td className="px-3 py-2">{row.productivity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
