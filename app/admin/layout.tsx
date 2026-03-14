import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";

const adminLinks = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/roles", label: "Roles" },
  { href: "/admin/facilities", label: "Facilities" },
  { href: "/admin/dashboards", label: "Dashboards" },
  { href: "/admin/integrations", label: "Integrations" },
  { href: "/admin/settings", label: "Settings" }
];

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  if (hasSupabaseEnv()) {
    const profile = await requireAdmin();

    if (!profile) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="container py-8">
      <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold">Admin Control Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage users, roles, facilities, dashboard configuration, integrations, and organization settings.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}
