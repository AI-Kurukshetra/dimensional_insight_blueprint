"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const chronicDiseaseTracking = [
  { name: "Diabetes", active: 1220 },
  { name: "CHF", active: 342 },
  { name: "COPD", active: 410 },
  { name: "CKD", active: 286 }
];

const cohortAnalysis = [
  { cohort: "High-risk", completion: 71 },
  { cohort: "Rising-risk", completion: 64 },
  { cohort: "Preventive", completion: 82 }
];

const demographics = [
  { group: "18-34", count: 940, color: "#0f766e" },
  { group: "35-49", count: 1480, color: "#0284c7" },
  { group: "50-64", count: 2140, color: "#f59e0b" },
  { group: "65+", count: 1660, color: "#e11d48" }
];

const heatmap = [
  [0.12, 0.35, 0.55, 0.78],
  [0.18, 0.4, 0.61, 0.82],
  [0.1, 0.28, 0.52, 0.76],
  [0.16, 0.33, 0.58, 0.84]
];

export function PopulationHealthModule() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold">Population health analytics</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Patient risk stratification, chronic disease tracking, and preventive care gap analysis powered by demographics, diagnoses, and lab results.
        </p>
      </div>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Risk heatmap</CardTitle>
            <CardDescription>Density of risk by age segment and chronic condition burden.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {heatmap.flatMap((row, rowIndex) =>
                row.map((value, columnIndex) => (
                  <div
                    key={`${rowIndex}-${columnIndex}`}
                    className="aspect-square rounded-xl"
                    style={{
                      backgroundColor: `rgba(14, 116, 144, ${value})`
                    }}
                    title={`Risk intensity ${value}`}
                  />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chronic disease tracking</CardTitle>
            <CardDescription>Active panel volume by major chronic program.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chronicDiseaseTracking}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="active" fill="#0f766e" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cohort analysis</CardTitle>
            <CardDescription>Completion rate across targeted outreach cohorts.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cohortAnalysis}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="cohort" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="completion" fill="#0284c7" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demographic distribution</CardTitle>
            <CardDescription>Population distribution used in preventive care targeting.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {demographics.map((group) => (
              <div key={group.group}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">{group.group}</span>
                  <span className="text-sm text-muted-foreground">{group.count} members</span>
                </div>
                <div className="h-3 rounded-full bg-muted">
                  <div
                    className="h-3 rounded-full"
                    style={{
                      width: `${(group.count / 1660) * 100}%`,
                      backgroundColor: group.color
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
