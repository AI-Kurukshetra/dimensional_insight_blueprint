import { createClient } from "@/lib/supabase/server";

export async function getReportCatalog(organizationId: string) {
  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("reports")
    .select("id, name, category, status, schedule_cron, created_at")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  return data ?? [];
}
