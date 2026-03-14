import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Database, ShieldCheck, Stethoscope, TrendingUp } from "lucide-react";
import { demoOverview } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage({
  searchParams
}: {
  searchParams: { code?: string; next?: string };
}) {
  if (searchParams.code) {
    const next = searchParams.next ?? "/dashboard";
    const safeNext = next.startsWith("/") ? next : "/dashboard";
    redirect(`/auth/callback?code=${encodeURIComponent(searchParams.code)}&next=${encodeURIComponent(safeNext)}`);
  }

  return (
    <main className="min-h-screen">
      <section className="surface-grid border-b bg-slate-950 text-white">
        <div className="container py-24">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">
                Healthcare analytics SaaS
              </div>
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
                HealthScope Analytics Suite
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-slate-300">
                Production-ready Next.js 14 platform for multi-tenant healthcare analytics, Supabase auth, modular dashboards, S3 report exports, and FHIR/EHR integrations.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/login">
                    Open platform
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                  <Link href="/login">Configure authentication</Link>
                </Button>
              </div>
            </div>

            <Card className="border-white/10 bg-white/5 text-white">
              <CardHeader>
                <CardTitle className="text-white">Seeded tenant overview</CardTitle>
                <CardDescription className="text-slate-300">
                  Demo data is bundled so the suite looks populated on first install.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {demoOverview.executiveKpis.map((metric) => (
                  <div key={metric.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm text-slate-300">{metric.label}</div>
                    <div className="mt-2 text-3xl font-semibold">{metric.value}</div>
                    <div className="mt-1 text-sm text-cyan-200">{metric.change}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container py-20">
        <div className="grid gap-6 lg:grid-cols-4">
          {[
            {
              icon: ShieldCheck,
              title: "Role-based access",
              description: "Admin, Executive, Physician, and Analyst roles with tenant-aware access patterns."
            },
            {
              icon: TrendingUp,
              title: "Clinical + financial analytics",
              description: "Modular dashboards for operations, reimbursement, value-based care, and quality."
            },
            {
              icon: Database,
              title: "Integration-ready backend",
              description: "Supabase PostgreSQL, API routes, FHIR sync scaffolding, and S3 export support."
            },
            {
              icon: Stethoscope,
              title: "Healthcare-specific design",
              description: "Built for health systems, facilities, providers, patients, alerts, and reporting workflows."
            }
          ].map((item) => (
            <Card key={item.title} className="border-0 shadow-lg shadow-slate-200/60">
              <CardHeader>
                <item.icon className="h-10 w-10 rounded-2xl bg-primary/10 p-2 text-primary" />
                <CardTitle className="mt-4">{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
