import { OverviewClient } from "@/components/dashboard/overview-client";
import { UserProfileCard } from "@/components/dashboard/user-profile-card";
import { requireOrganizationAccess } from "@/lib/auth";
import { getUserProfile } from "@/lib/getUserProfile";
import { getOverviewData } from "@/lib/platform-data";

export default async function OrganizationDashboardPage({
  params
}: {
  params: { slug: string };
}) {
  await requireOrganizationAccess(params.slug);
  const overview = await getOverviewData(params.slug);
  const profile = await getUserProfile();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
            Protected tenant dashboard
          </div>
          <h2 className="mt-2 text-3xl font-semibold">{overview.organization.name}</h2>
          <p className="mt-2 text-muted-foreground">
            Access to this route is restricted by authenticated session and organization membership.
          </p>
        </div>
        <UserProfileCard
          profile={profile}
          fallbackOrganizationName={overview.organization.name}
        />
      </div>
      <OverviewClient initialData={overview} />
    </div>
  );
}
