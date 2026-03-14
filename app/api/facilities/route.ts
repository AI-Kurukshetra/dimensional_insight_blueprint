import { NextResponse } from "next/server";
import { demoOverview } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { resolveTenantContext } from "@/lib/api";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(demoOverview.facilities);
  }

  const context = await resolveTenantContext();
  if ("error" in context) {
    return context.error;
  }

  const { data, error } = await context.supabase
    .from("facilities")
    .select("*")
    .eq("organization_id", context.organizationId)
    .is("deleted_at", null);

  if (error) {
    return NextResponse.json(demoOverview.facilities);
  }

  return NextResponse.json(
    data.map((facility: any) => ({
      id: facility.id,
      organizationId: facility.organization_id,
      name: facility.name,
      type: facility.facility_type,
      city: facility.city,
      state: facility.state,
      beds: facility.bed_count
    }))
  );
}

export async function POST(request: Request) {
  const context = await resolveTenantContext();
  if ("error" in context) {
    return context.error;
  }

  if (context.role !== "admin") {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }

  const body = (await request.json()) as {
    name: string;
    facilityType: string;
    city: string;
    state: string;
    bedCount?: number;
  };

  const { data, error } = await context.supabase
    .from("facilities")
    .insert({
      organization_id: context.organizationId,
      name: body.name,
      facility_type: body.facilityType,
      city: body.city,
      state: body.state,
      bed_count: body.bedCount ?? 0
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
