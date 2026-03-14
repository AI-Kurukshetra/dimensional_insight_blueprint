import { NextResponse } from "next/server";
import { demoProviders } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { resolveTenantContext } from "@/lib/api";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(demoProviders);
  }

  const context = await resolveTenantContext();
  if ("error" in context) {
    return context.error;
  }

  const { data, error } = await context.supabase
    .from("providers")
    .select("*")
    .eq("organization_id", context.organizationId)
    .is("deleted_at", null)
    .limit(50);

  if (error) {
    return NextResponse.json(demoProviders);
  }

  return NextResponse.json(
    data.map((provider: any) => ({
      id: provider.id,
      organizationId: provider.organization_id,
      facilityId: provider.facility_id,
      fullName: provider.full_name,
      npi: provider.npi,
      specialty: provider.specialty
    }))
  );
}
