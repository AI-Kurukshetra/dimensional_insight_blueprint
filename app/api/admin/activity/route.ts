import { NextResponse } from "next/server";
import { resolveTenantContext } from "@/lib/api";

export async function GET(request: Request) {
  const context = await resolveTenantContext();
  if ("error" in context) {
    return context.error;
  }

  if (context.role !== "admin") {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const requested = Number(searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 200) : 20;

  const { data, error } = await context.supabase
    .from("user_events")
    .select("id, event_name, event_type, dashboard_slug, occurred_at, payload")
    .eq("organization_id", context.organizationId)
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json([]);
  }

  return NextResponse.json(data ?? []);
}
