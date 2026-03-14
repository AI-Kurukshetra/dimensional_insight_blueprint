import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { demoLabResults, demoPatients, demoProviders } from "@/lib/demo-data";

export default function DataPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold">Patient & provider data</h2>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Normalized demographic, diagnosis, provider, and lab result records stored in Supabase and exposed through tenant-aware API routes.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Patients</CardTitle>
            <CardDescription>Representative attributed patient records.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoPatients.map((patient) => (
              <div key={patient.id} className="rounded-2xl border p-4">
                <div className="font-medium">{patient.fullName}</div>
                <div className="text-sm text-muted-foreground">
                  {patient.primaryCondition} • {patient.riskLevel} risk
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Providers</CardTitle>
            <CardDescription>Sample provider records and specialties.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoProviders.map((provider) => (
              <div key={provider.id} className="rounded-2xl border p-4">
                <div className="font-medium">{provider.fullName}</div>
                <div className="text-sm text-muted-foreground">
                  {provider.specialty} • NPI {provider.npi}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lab results</CardTitle>
            <CardDescription>Data source for abnormal value monitoring and alert generation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoLabResults.map((result) => (
              <div key={result.id} className="rounded-2xl border p-4">
                <div className="font-medium">{result.testName}</div>
                <div className="text-sm text-muted-foreground">
                  Value {result.valueNumeric} • {result.abnormalFlag ? "Abnormal" : "Normal"}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
