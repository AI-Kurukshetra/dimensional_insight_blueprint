import { DataTable } from "@/components/tables/data-table";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export default async function AdminIntegrationsPage() {
  if (!hasSupabaseEnv()) {
    return <div className="rounded-xl border bg-white p-4">Supabase is not configured.</div>;
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("integration_connections")
    .select("source_name, connector_type, status, last_sync_at")
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Integration Hub</h2>
      <DataTable
        columns={["Source", "Connector", "Status", "Last Sync"]}
        rows={(data ?? []).map((item: any) => [
          item.source_name,
          item.connector_type,
          item.status,
          item.last_sync_at ? new Date(item.last_sync_at).toLocaleString() : "-"
        ])}
      />
    </div>
  );
}
