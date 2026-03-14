import { DataTable } from "@/components/tables/data-table";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export default async function AdminDashboardsPage() {
  if (!hasSupabaseEnv()) {
    return <div className="rounded-xl border bg-white p-4">Supabase is not configured.</div>;
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("dashboards")
    .select("name, slug, status, role_slug, facility_id")
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Dashboard Builder</h2>
      <DataTable
        columns={["Name", "Slug", "Status", "Role", "Facility"]}
        rows={(data ?? []).map((item: any) => [
          item.name,
          item.slug,
          item.status,
          item.role_slug,
          item.facility_id ?? "All"
        ])}
      />
    </div>
  );
}
