"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ReportExportActions } from "@/components/dashboard/report-export-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { KpiMetric } from "@/lib/types";

const kpis: KpiMetric[] = [
  {
    id: "fk-1",
    label: "Total Revenue",
    value: "$9.4M",
    change: "+3.1%",
    direction: "up",
    description: "Month-to-date recognized revenue"
  },
  {
    id: "fk-2",
    label: "Claim Approval Rate",
    value: "89.0%",
    change: "+1.2 pts",
    direction: "up",
    description: "Approved claims versus total submitted"
  },
  {
    id: "fk-3",
    label: "Cost Per Case",
    value: "$6,420",
    change: "-1.4%",
    direction: "down",
    description: "Average operational and treatment cost per case"
  }
];

const financialTableRows = [
  {
    claim: "Claim1",
    amount: "$1,250",
    status: "Approved",
    payer: "BlueCross"
  },
  {
    claim: "Claim2",
    amount: "$2,300",
    status: "Pending",
    payer: "UnitedHealth"
  },
  {
    claim: "Claim3",
    amount: "$890",
    status: "Approved",
    payer: "Aetna"
  },
  {
    claim: "Claim4",
    amount: "$4,100",
    status: "Denied",
    payer: "Cigna"
  }
];

const revenueByDepartment = [
  { department: "Cardiology", revenue: 2.4 },
  { department: "Orthopedics", revenue: 1.9 },
  { department: "Oncology", revenue: 1.6 },
  { department: "Emergency", revenue: 1.3 },
  { department: "Primary Care", revenue: 1.1 }
];

const monthlyRevenueTrend = [
  { month: "Oct", revenue: 8.1 },
  { month: "Nov", revenue: 8.4 },
  { month: "Dec", revenue: 8.7 },
  { month: "Jan", revenue: 8.9 },
  { month: "Feb", revenue: 9.2 },
  { month: "Mar", revenue: 9.4 }
];

const payerMix = [
  { name: "Commercial", value: 42, color: "#0f766e" },
  { name: "Medicare", value: 31, color: "#0284c7" },
  { name: "Medicaid", value: 18, color: "#f59e0b" },
  { name: "Self-pay", value: 9, color: "#e11d48" }
];

export function FinancialDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-3xl font-semibold">Healthcare financial analytics</h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Revenue per department, payer mix, claims denial rate, cost per case, and monthly revenue trend in a single finance-ready workspace.
          </p>
        </div>
        <ReportExportActions />
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {kpis.map((metric) => (
          <KpiCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue per department</CardTitle>
            <CardDescription>Bar chart view of departmental revenue contribution.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByDepartment}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="department" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#0f766e" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payer mix</CardTitle>
            <CardDescription>Pie chart segmentation by reimbursement source.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={payerMix} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110}>
                  {payerMix.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Monthly revenue trend</CardTitle>
            <CardDescription>Line chart for executive and board-ready revenue monitoring.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyRevenueTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#0284c7" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Insurance Claims Table</CardTitle>
          <CardDescription>Claim approval and denial visibility by payer.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Claim</th>
                <th className="px-3 py-2 font-medium">Amount</th>
                <th className="px-3 py-2 font-medium">Payer</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {financialTableRows.map((row) => (
                <tr key={row.claim} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-medium">{row.claim}</td>
                  <td className="px-3 py-2">{row.amount}</td>
                  <td className="px-3 py-2">{row.payer}</td>
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
