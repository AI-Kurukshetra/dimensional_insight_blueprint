import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { getCurrentUser, requireOrganizationAccess } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { getOverviewData } from "@/lib/platform-data";
import { trackDashboardView } from "@/lib/activity";

export default async function OrganizationLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  if (hasSupabaseEnv()) {
    const user = await getCurrentUser();
    if (!user) {
      redirect("/login?message=Please sign in to continue.");
    }
  }

  await requireOrganizationAccess(params.slug);
  const overview = await getOverviewData(params.slug);

  if (hasSupabaseEnv()) {
    await trackDashboardView({
      dashboardSlug: `org-${params.slug}`,
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
