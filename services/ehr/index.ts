import { createClient } from "@/lib/supabase/server";

export async function getIntegrationStatus(organizationId: string) {
  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("integration_connections")
    .select("id, source_name, standard_name, status, last_sync_at")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  return data ?? [];
}
