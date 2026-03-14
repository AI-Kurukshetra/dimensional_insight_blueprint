import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type TrackDashboardInput = {
  dashboardSlug: string;
  organizationId: string;
  facilityId?: string | null;
};

export async function trackDashboardView(input: TrackDashboardInput) {
  if (!hasSupabaseEnv()) {
    return;
  }

  const supabase = (await createClient()) as any;
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const viewedAt = new Date().toISOString();

  await supabase.from("dashboard_views").insert({
    organization_id: input.organizationId,
    user_id: user.id,
    facility_id: input.facilityId ?? null,
    dashboard_id: null,
    dashboard_slug: input.dashboardSlug,
    role_id: null,
    viewed_at: viewedAt,
    duration_seconds: 0
  } as any);

  await supabase.from("active_sessions").upsert(
    {
      organization_id: input.organizationId,
      user_id: user.id,
      facility_id: input.facilityId ?? null,
      role_id: null,
      dashboard_slug: input.dashboardSlug,
      session_status: "active",
      connected_at: viewedAt,
      last_seen_at: viewedAt
    } as any,
    { onConflict: "user_id,dashboard_slug" }
  );

  await supabase.from("user_events").insert({
    organization_id: input.organizationId,
    user_id: user.id,
    event_type: "dashboard_view",
    event_name: "Dashboard Viewed",
    dashboard_slug: input.dashboardSlug,
    payload: { facilityId: input.facilityId ?? null },
    occurred_at: viewedAt
  } as any);
}

type LogActivityInput = {
  supabase?: any;
  userId: string;
  organizationId: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Writes auditable activity records for RBAC-protected actions.
 * The primary sink is public.activity_logs with compatibility write to user_activity_logs.
 */
export async function logActivity(input: LogActivityInput) {
  if (!hasSupabaseEnv()) {
    return;
  }

  const supabase = input.supabase ?? ((await createClient()) as any);
  const now = new Date().toISOString();

  await supabase
    .from("activity_logs")
    .insert({
      user_id: input.userId,
      organization_id: input.organizationId,
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId ?? null,
      metadata: input.metadata ?? {},
      created_at: now
    } as any)
    .then(() => null)
    .catch(() => null);

  await supabase
    .from("user_activity_logs")
    .insert({
      organization_id: input.organizationId,
      user_id: input.userId,
      activity_type: `rbac.${input.action}`,
      action: input.action,
      entity_type: input.resourceType,
      entity_id: input.resourceId ?? null,
      metadata: input.metadata ?? {},
      occurred_at: now
    } as any)
    .then(() => null)
    .catch(() => null);
}
