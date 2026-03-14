import { DataTable } from "@/components/tables/data-table";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export default async function AdminRolesPage() {
  if (!hasSupabaseEnv()) {
    return <div className="rounded-xl border bg-white p-4">Supabase is not configured.</div>;
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("roles")
    .select("name, slug, is_system")
    .order("name", { ascending: true });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Roles & Permissions</h2>
      <DataTable
        columns={["Role", "Slug", "System Role"]}
        rows={(data ?? []).map((item: any) => [item.name, item.slug, item.is_system ? "Yes" : "No"])}
      />
    </div>
  );
}
