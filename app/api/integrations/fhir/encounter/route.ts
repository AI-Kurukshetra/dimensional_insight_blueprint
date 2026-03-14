import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";
import { resolveTenantContext } from "@/lib/api";

const demoEncounters = [
  {
    id: "encounter-emma",
    patient_id: "patient-1",
    encounter_type: "Outpatient",
    encounter_date: "2026-03-11T10:30:00.000Z",
    discharge_date: "2026-03-11T11:10:00.000Z"
  },
  {
    id: "encounter-michael",
    patient_id: "patient-2",
    encounter_type: "Emergency",
    encounter_date: "2026-03-09T04:15:00.000Z",
    discharge_date: "2026-03-10T13:20:00.000Z"
  }
];

function encounterClassCode(encounterType: string) {
  const normalized = encounterType.toLowerCase();
  if (normalized.includes("inpatient")) {
    return "IMP";
  }
  if (normalized.includes("emergency")) {
    return "EMER";
  }
  return "AMB";
}

function toEncounterResource(input: {
  id: string;
  patientId: string;
  encounterType: string;
  encounterDate: string;
  dischargeDate?: string | null;
}) {
  return {
    resourceType: "Encounter",
    id: input.id,
    status: "finished",
    class: {
      system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
      code: encounterClassCode(input.encounterType),
      display: input.encounterType
    },
    subject: {
      reference: `Patient/${input.patientId}`
    },
    period: {
      start: input.encounterDate,
      end: input.dischargeDate ?? input.encounterDate
    },
    type: [
      {
        text: input.encounterType
      }
    ]
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const encounterId = searchParams.get("encounterId");

  if (!hasSupabaseEnv()) {
    const filtered = encounterId
      ? demoEncounters.filter((encounter) => encounter.id === encounterId)
      : demoEncounters;

    return NextResponse.json({
      resourceType: "Bundle",
      type: "collection",
      total: filtered.length,
      entry: filtered.map((encounter) => ({
        resource: toEncounterResource({
          id: encounter.id,
          patientId: encounter.patient_id,
          encounterType: encounter.encounter_type,
          encounterDate: encounter.encounter_date,
          dischargeDate: encounter.discharge_date
        })
      }))
    });
  }

  const context = await resolveTenantContext();
  if ("error" in context) {
    return context.error;
  }

  let query = context.supabase
    .from("clinical_encounters")
    .select("id, patient_id, encounter_type, encounter_date, discharge_date")
    .eq("organization_id", context.organizationId)
    .is("deleted_at", null)
    .limit(100);

  if (encounterId) {
    query = query.eq("id", encounterId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: "Failed to load FHIR encounter resources", details: error.message },
      { status: 500 }
    );
  }

  const entries = (data ?? []).map((encounter: any) => ({
    resource: toEncounterResource({
      id: encounter.id as string,
      patientId: encounter.patient_id as string,
      encounterType: encounter.encounter_type as string,
      encounterDate: encounter.encounter_date as string,
      dischargeDate: (encounter.discharge_date as string | null) ?? null
    })
  }));

  return NextResponse.json({
    resourceType: "Bundle",
    type: "collection",
    total: entries.length,
    entry: entries
  });
}
