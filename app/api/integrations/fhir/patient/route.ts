import { NextResponse } from "next/server";
import { demoPatients } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { resolveTenantContext } from "@/lib/api";

function toPatientResource(input: {
  id: string;
  fullName: string;
  gender: string;
  dateOfBirth: string;
}) {
  const [first = "", ...rest] = input.fullName.split(" ");
  const last = rest.join(" ");

  return {
    resourceType: "Patient",
    id: input.id,
    active: true,
    name: [
      {
        use: "official",
        family: last || first,
        given: [first, ...rest].filter(Boolean)
      }
    ],
    gender: input.gender.toLowerCase(),
    birthDate: input.dateOfBirth
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");

  if (!hasSupabaseEnv()) {
    const filtered = patientId
      ? demoPatients.filter((patient) => patient.id === patientId)
      : demoPatients;

    return NextResponse.json({
      resourceType: "Bundle",
      type: "collection",
      total: filtered.length,
      entry: filtered.map((patient) => ({
        resource: toPatientResource({
          id: patient.id,
          fullName: patient.fullName,
          gender: patient.gender,
          dateOfBirth: patient.dateOfBirth
        })
      }))
    });
  }

  const context = await resolveTenantContext();
  if ("error" in context) {
    return context.error;
  }

  let query = context.supabase
    .from("patients")
    .select("id, full_name, gender, date_of_birth")
    .eq("organization_id", context.organizationId)
    .is("deleted_at", null)
    .limit(100);

  if (patientId) {
    query = query.eq("id", patientId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: "Failed to load FHIR patient resources", details: error.message },
      { status: 500 }
    );
  }

  const entries = (data ?? []).map((patient: any) => ({
    resource: toPatientResource({
      id: patient.id as string,
      fullName: patient.full_name as string,
      gender: patient.gender as string,
      dateOfBirth: patient.date_of_birth as string
    })
  }));

  return NextResponse.json({
    resourceType: "Bundle",
    type: "collection",
    total: entries.length,
    entry: entries
  });
}
