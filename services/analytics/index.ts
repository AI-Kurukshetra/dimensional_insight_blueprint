import { createClient } from "@/lib/supabase/server";

export async function getAnalyticsSummary(organizationId: string) {
  const supabase = (await createClient()) as any;

  const [patients, providers, encounters] = await Promise.all([
    supabase.from("patients").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("providers").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase
      .from("clinical_encounters")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
  ]);

  return {
    patientCount: patients.count ?? 0,
    providerCount: providers.count ?? 0,
    encounterCount: encounters.count ?? 0
  };
}
