import { demoOverview } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { OverviewData } from "@/lib/types";

export async function getOverviewData(
  organizationIdentifier = demoOverview.organization.id
): Promise<OverviewData> {
  if (!hasSupabaseEnv()) {
    return demoOverview;
  }

  try {
    const supabase = (await createClient()) as any;
    const organizationLookup = await supabase
      .from("organizations")
      .select("*")
      .or(`id.eq.${organizationIdentifier},slug.eq.${organizationIdentifier}`)
      .single();

    if (organizationLookup.error || !organizationLookup.data) {
      return demoOverview;
    }

    const organizationId = organizationLookup.data.id;

    const [
      facilitiesResult,
      clinicalResult,
      financialResult,
      populationResult,
      alertsResult,
      integrationsResult,
      reportsResult
    ] = await Promise.all([
      supabase.from("facilities").select("*").eq("organization_id", organizationId),
      supabase.from("clinical_metrics").select("*").eq("organization_id", organizationId),
      supabase.from("financial_metrics").select("*").eq("organization_id", organizationId),
      supabase.from("population_segments").select("*").eq("organization_id", organizationId),
      supabase.from("alerts").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false }),
      supabase.from("integration_connections").select("*").eq("organization_id", organizationId),
      supabase.from("report_exports").select("*").eq("organization_id", organizationId).order("created_at", { ascending: false })
    ]);

    if (
      facilitiesResult.error ||
      clinicalResult.error ||
      financialResult.error ||
      populationResult.error ||
      alertsResult.error ||
      integrationsResult.error ||
      reportsResult.error
    ) {
      return demoOverview;
    }

    return {
      organization: {
        id: organizationLookup.data.id,
        name: organizationLookup.data.name,
        slug: organizationLookup.data.slug,
        planTier: organizationLookup.data.plan_tier,
        payerFocus: organizationLookup.data.payer_focus
      },
      facilities: (facilitiesResult.data ?? []).map((facility: any) => ({
        id: facility.id,
        organizationId: facility.organization_id,
        name: facility.name,
        type: facility.facility_type,
        city: facility.city,
        state: facility.state,
        beds: facility.bed_count
      })),
      user: demoOverview.user,
      executiveKpis: demoOverview.executiveKpis,
      clinicalMetrics: (clinicalResult.data ?? []).map((metric: any) => ({
        id: metric.id,
        name: metric.metric_name,
        current: metric.current_value,
        target: metric.target_value,
        unit: metric.unit,
        trend: metric.trend_direction
      })),
      financialMetrics: (financialResult.data ?? []).map((metric: any) => ({
        id: metric.id,
        name: metric.metric_name,
        current: metric.current_display,
        target: metric.target_display,
        note: metric.note
      })),
      populationCohorts: (populationResult.data ?? []).map((cohort: any) => ({
        id: cohort.id,
        cohort: cohort.cohort_name,
        members: cohort.member_count,
        completionRate: cohort.completion_rate,
        riskLevel: cohort.risk_level
      })),
      alerts: (alertsResult.data ?? []).map((alert: any) => ({
        id: alert.id,
        organizationId: alert.organization_id,
        facilityId: alert.facility_id,
        title: alert.title,
        description: alert.description,
        severity: alert.severity,
        status: alert.status,
        owner: alert.owner_name,
        timestamp: alert.created_at,
        module: alert.module_name
      })),
      integrations: (integrationsResult.data ?? []).map((integration: any) => ({
        id: integration.id,
        organizationId: integration.organization_id,
        source: integration.source_name,
        category: integration.category_name,
        standard: integration.standard_name,
        status: integration.status,
        latencyMinutes: integration.latency_minutes,
        lastSync: integration.last_sync_at
      })),
      reportExports: (reportsResult.data ?? []).map((report: any) => ({
        id: report.id,
        title: report.title,
        format: report.export_format,
        status: report.status,
        createdAt: report.created_at,
        path: report.storage_path ?? undefined
      })),
      revenueSeries: demoOverview.revenueSeries,
      qualitySeries: demoOverview.qualitySeries,
      isDemo: false
    };
  } catch {
    return demoOverview;
  }
}
