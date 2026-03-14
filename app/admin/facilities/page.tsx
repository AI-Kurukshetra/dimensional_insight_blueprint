import { DataTable } from "@/components/tables/data-table";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export default async function AdminFacilitiesPage() {
  if (!hasSupabaseEnv()) {
    return <div className="rounded-xl border bg-white p-4">Supabase is not configured.</div>;
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("facilities")
    .select("name, facility_type, city, state, bed_count")
    .order("name", { ascending: true });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Facility Management</h2>
      <DataTable
        columns={["Facility", "Type", "City", "State", "Beds"]}
        rows={(data ?? []).map((item: any) => [
          item.name,
          item.facility_type,
          item.city,
          item.state,
          item.bed_count
        ])}
      />
    </div>
  );
}
