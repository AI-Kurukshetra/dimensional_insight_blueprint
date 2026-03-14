import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getOverviewData } from "@/lib/platform-data";

export default async function IntegrationsPage() {
  const overview = await getOverviewData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold">Data Integration Hub</h2>
        <p className="mt-2 text-muted-foreground">
          HL7 FHIR, Epic API, and Cerner API connectors with ingestion pipelines, background sync jobs, and validation-ready normalization into Supabase tables.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          {
            title: "FHIR connector",
            body: "POST to /api/integrations/fhir/sync for resource-type sync jobs and normalized ingestion staging."
          },
          {
            title: "Epic connector",
            body: "POST to /api/integrations/epic/sync to queue Epic API synchronization."
          },
          {
            title: "Cerner connector",
            body: "POST to /api/integrations/cerner/sync to queue Cerner synchronization."
          }
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.body}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {overview.integrations.map((integration) => (
          <Card key={integration.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{integration.source}</CardTitle>
                <Badge
                  variant={
                    integration.status === "healthy"
                      ? "success"
                      : integration.status === "warning"
                        ? "warning"
                        : "destructive"
                  }
                >
                  {integration.status}
                </Badge>
              </div>
              <CardDescription>
                {integration.category} • {integration.standard}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div>Latency: {integration.latencyMinutes} minutes</div>
              <div>Last sync: {new Date(integration.lastSync).toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
