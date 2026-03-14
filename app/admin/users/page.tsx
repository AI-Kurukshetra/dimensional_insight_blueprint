import { DataTable } from "@/components/tables/data-table";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/env";

export default async function AdminUsersPage() {
  if (!hasSupabaseEnv()) {
    return <div className="rounded-xl border bg-white p-4">Supabase is not configured.</div>;
  }

  const supabase = (await createClient()) as any;
  const { data } = await supabase
    .from("users")
    .select("id, full_name, email, status, last_login")
    .order("updated_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">User Management</h2>
      <DataTable
        columns={["Name", "Email", "Status", "Last Login"]}
        rows={(data ?? []).map((item: any) => [
          item.full_name,
          item.email,
          item.status,
          item.last_login ? new Date(item.last_login).toLocaleString() : "Never"
        ])}
      />
    </div>
  );
}
