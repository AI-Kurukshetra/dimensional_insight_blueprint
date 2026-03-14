import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOverviewData } from "@/lib/platform-data";

export default async function OrganizationsPage() {
  const overview = await getOverviewData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold">Organization & Facility Management</h2>
        <p className="mt-2 text-muted-foreground">
          Multi-tenant foundation for health systems, hospitals, clinics, and operating entities.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{overview.organization.name}</CardTitle>
          <CardDescription>
            {overview.organization.planTier} plan • {overview.organization.payerFocus}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {overview.facilities.map((facility) => (
            <div key={facility.id} className="rounded-2xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{facility.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {facility.city}, {facility.state}
                  </div>
                </div>
                <Badge variant="outline">{facility.type}</Badge>
              </div>
              <div className="mt-3 text-sm text-muted-foreground">{facility.beds} beds</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
