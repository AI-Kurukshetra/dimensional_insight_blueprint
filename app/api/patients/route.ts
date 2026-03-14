import { NextResponse } from "next/server";
import { demoPatients } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { resolveTenantContext } from "@/lib/api";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(demoPatients);
  }

  const context = await resolveTenantContext();
  if ("error" in context) {
    return context.error;
  }

  const { data, error } = await context.supabase
    .from("patients")
    .select("*")
    .eq("organization_id", context.organizationId)
    .is("deleted_at", null)
    .limit(50);

  if (error) {
    return NextResponse.json(demoPatients);
  }

  return NextResponse.json(
    data.map((patient: any) => ({
      id: patient.id,
      organizationId: patient.organization_id,
      facilityId: patient.facility_id,
      fullName: patient.full_name,
      dateOfBirth: patient.date_of_birth,
      gender: patient.gender,
      primaryCondition: patient.primary_condition,
      riskLevel: patient.risk_level
    }))
  );
}
