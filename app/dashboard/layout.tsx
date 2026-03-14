import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { ensureUserOrganization } from "@/lib/auth/ensureUserOrganization";
import { getOverviewData } from "@/lib/platform-data";
import { hasSupabaseEnv } from "@/lib/env";
import { trackDashboardView } from "@/lib/activity";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  if (hasSupabaseEnv()) {
    const supabase = (await createClient()) as any;
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/login?message=Sign in to access the analytics workspace.");
    }

    const organizationId = await ensureUserOrganization({
      supabase,
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata
      }
    }).catch(() => null);

    if (!organizationId) {
      redirect("/api/setup-user");
    }
  }

  const overview = await getOverviewData();

  if (hasSupabaseEnv()) {
    await trackDashboardView({
      dashboardSlug: "overview",
      organizationId: overview.organization.id
    });
  }

  return (
    <div className="min-h-screen bg-slate-100/70 lg:flex">
      <DashboardSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <DashboardHeader user={overview.user} facilities={overview.facilities} />
        <main className="container flex-1 py-6">{children}</main>
      </div>
    </div>
  );
}
