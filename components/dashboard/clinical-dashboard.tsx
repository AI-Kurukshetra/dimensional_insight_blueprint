"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { KpiMetric } from "@/lib/types";

const clinicalKpis: KpiMetric[] = [
  {
    id: "clinical-patient-count",
    label: "Patient Count",
    value: "4",
    change: "+1",
    direction: "up",
    description: "Active demo patients tracked in clinical analytics"
  },
  {
    id: "clinical-readmission-rate",
    label: "Readmission Rate",
    value: "12.5%",
    change: "-1.0 pts",
    direction: "down",
    description: "30-day readmission trend for monitored encounters"
  },
  {
    id: "clinical-los",
    label: "Average Length of Stay",
    value: "4.2 days",
    change: "-0.3 days",
    direction: "down",
    description: "Average inpatient length of stay"
  },
  {
    id: "clinical-top-diagnoses",
    label: "Top Diagnoses",
    value: "Hypertension",
    change: "Most frequent",
    direction: "up",
    description: "Leading diagnosis from current encounter mix"
  }
];

const diagnosisDistribution = [
  { diagnosis: "Hypertension", count: 14 },
  { diagnosis: "Diabetes", count: 11 },
  { diagnosis: "Pneumonia", count: 7 },
  { diagnosis: "Asthma", count: 5 }
];

const encounterMix = [
  { type: "Outpatient", value: 2 },
  { type: "Emergency", value: 1 },
  { type: "Inpatient", value: 1 }
];

const diagnosisTableRows = [
  { patient: "Emma Wilson", diagnosis: "Hypertension", provider: "Dr Olivia Patel", type: "Outpatient" },
  { patient: "Michael Carter", diagnosis: "Pneumonia", provider: "Dr Daniel Kim", type: "Emergency" },
  { patient: "Sophia Martinez", diagnosis: "Asthma", provider: "Dr Olivia Patel", type: "Outpatient" },
  { patient: "Noah Johnson", diagnosis: "Diabetes", provider: "Dr Daniel Kim", type: "Inpatient" }
];

export function ClinicalDashboard() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {clinicalKpis.map((metric) => (
          <KpiCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Diagnoses</CardTitle>
            <CardDescription>Diagnosis distribution across recent encounters.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diagnosisDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="diagnosis" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0284c7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Encounter Type Mix</CardTitle>
            <CardDescription>Clinical encounter distribution.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={encounterMix} dataKey="value" nameKey="type" outerRadius={110} fill="#0f766e" />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Clinical Encounter Table</CardTitle>
          <CardDescription>Patient-level diagnosis and provider assignment.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Patient</th>
                <th className="px-3 py-2 font-medium">Diagnosis</th>
                <th className="px-3 py-2 font-medium">Provider</th>
                <th className="px-3 py-2 font-medium">Encounter Type</th>
              </tr>
            </thead>
            <tbody>
              {diagnosisTableRows.map((row) => (
                <tr key={`${row.patient}-${row.diagnosis}`} className="border-b last:border-b-0">
                  <td className="px-3 py-2 font-medium">{row.patient}</td>
                  <td className="px-3 py-2">{row.diagnosis}</td>
                  <td className="px-3 py-2">{row.provider}</td>
                  <td className="px-3 py-2">{row.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
