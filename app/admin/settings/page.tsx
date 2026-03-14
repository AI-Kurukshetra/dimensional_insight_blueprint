import { DataTable } from "@/components/tables/data-table";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export default async function AdminSettingsPage() {
  if (!hasSupabaseEnv()) {
    return <div className="rounded-xl border bg-white p-4">Supabase is not configured.</div>;
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("organization_settings")
    .select("setting_key, setting_value, scope")
    .order("setting_key", { ascending: true });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Organization Settings</h2>
      <DataTable
        columns={["Setting", "Scope", "Value"]}
        rows={(data ?? []).map((item: any) => [
          item.setting_key,
          item.scope,
          JSON.stringify(item.setting_value)
        ])}
      />
    </div>
  );
}
