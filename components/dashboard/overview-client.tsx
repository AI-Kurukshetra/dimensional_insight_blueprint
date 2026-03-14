"use client";

import Link from "next/link";
import { BarChart3, Building2, FileCog, Globe2, Shield, Siren } from "lucide-react";
import { useOrganizationOverview } from "@/hooks/use-organization-overview";
import { RevenueChart } from "@/components/charts/revenue-chart";
import { QualitySparkline } from "@/components/charts/quality-sparkline";
import { AlertsList } from "@/components/dashboard/alerts-list";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OverviewData } from "@/lib/types";

export function OverviewClient({ initialData }: { initialData: OverviewData }) {
  const query = useOrganizationOverview(initialData.organization.id, initialData);
  const data = query.data ?? initialData;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.executiveKpis.map((metric) => (
          <KpiCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card className="surface-grid overflow-hidden border-0 bg-gradient-to-br from-cyan-950 to-slate-900 text-white">
          <CardHeader>
            <div className="flex items-center gap-2 text-cyan-200">
              <Shield className="h-4 w-4" />
              HIPAA-minded architecture
            </div>
            <CardTitle className="text-white">Production-ready analytics operating layer</CardTitle>
            <CardDescription className="text-slate-300">
              Next.js 14 App Router, Supabase RBAC, tenant isolation, API routes, S3 exports, and FHIR integration scaffolding.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-sm uppercase tracking-[0.18em] text-cyan-200">Deployment</div>
              <div className="mt-2 text-3xl font-semibold">Vercel-ready</div>
              <p className="mt-2 text-sm text-slate-200">
                Standard Next build, environment-based Supabase/S3 config, and server-safe integrations.
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <div className="text-sm uppercase tracking-[0.18em] text-cyan-200">Tenancy</div>
              <div className="mt-2 text-3xl font-semibold">{data.facilities.length} facilities</div>
              <p className="mt-2 text-sm text-slate-200">
                Organization-scoped data access with room for facility-specific segmentation and permissions.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Module coverage</CardTitle>
            <CardDescription>Core SaaS modules included in the base platform build.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: BarChart3, label: "Clinical analytics" },
              { icon: Building2, label: "Organization & facility management" },
              { icon: Globe2, label: "Population health" },
              { icon: Siren, label: "Real-time alerts" },
              { icon: FileCog, label: "Executive reporting" },
              { icon: Shield, label: "Role-based access" }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border bg-muted/40 p-4">
                <item.icon className="h-5 w-5 text-primary" />
                <div className="mt-2 font-medium">{item.label}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Tabs defaultValue="operations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="population">Population</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Clinical and quality trend</CardTitle>
              <CardDescription>Recharts-backed trend surface for executive storytelling.</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart data={data.revenueSeries} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quality sparkline</CardTitle>
              <CardDescription>D3-driven micro-visualization for longitudinal signal tracking.</CardDescription>
            </CardHeader>
            <CardContent>
              <QualitySparkline data={data.qualitySeries} />
              <div className="mt-4 grid gap-3">
                {data.clinicalMetrics.map((metric) => (
                  <div key={metric.id} className="rounded-2xl border bg-muted/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium">{metric.name}</div>
                      <Badge variant={metric.current >= metric.target ? "success" : "warning"}>
                        Target {metric.target}
                        {metric.unit}
                      </Badge>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Current: {metric.current}
                      {metric.unit}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Financial performance</CardTitle>
              <CardDescription>Revenue cycle and margin indicators across the tenant.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {data.financialMetrics.map((metric) => (
                <div key={metric.id} className="rounded-2xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{metric.name}</div>
                      <div className="text-sm text-muted-foreground">{metric.note}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold">{metric.current}</div>
                      <div className="text-sm text-muted-foreground">Target {metric.target}</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Report exports</CardTitle>
              <CardDescription>S3-backed export flow scaffolded for PDF, CSV, and XLSX delivery.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.reportExports.map((report) => (
                <div key={report.id} className="rounded-2xl border bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{report.title}</div>
                      <div className="text-sm text-muted-foreground">{report.format.toUpperCase()}</div>
                    </div>
                    <Badge variant={report.status === "ready" ? "success" : "warning"}>
                      {report.status}
                    </Badge>
                  </div>
                </div>
              ))}
              <Button asChild className="mt-2">
                <Link href="/dashboard/executive">Open executive reporting</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="population" className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Population cohorts</CardTitle>
              <CardDescription>Risk stratification and outreach performance snapshots.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {data.populationCohorts.map((cohort) => (
                <div key={cohort.id} className="rounded-2xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{cohort.cohort}</div>
                      <div className="text-sm text-muted-foreground">{cohort.members} members</div>
                    </div>
                    <Badge
                      variant={
                        cohort.riskLevel === "high"
                          ? "destructive"
                          : cohort.riskLevel === "moderate"
                            ? "warning"
                            : "success"
                      }
                    >
                      {cohort.riskLevel}
                    </Badge>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${cohort.completionRate}%` }}
                    />
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Outreach completion {cohort.completionRate}%
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <AlertsList alerts={data.alerts} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
