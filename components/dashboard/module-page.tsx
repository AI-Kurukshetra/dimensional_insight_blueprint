import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ModulePage({
  title,
  description,
  sections
}: {
  title: string;
  description: string;
  sections: Array<{ title: string; body: string; badge?: string }>;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold">{title}</h2>
          <p className="mt-2 max-w-3xl text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline">Production module</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{section.title}</CardTitle>
                {section.badge ? <Badge>{section.badge}</Badge> : null}
              </div>
              <CardDescription>{section.body}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              This module is scaffolded to plug into Supabase-backed APIs, tenant-aware filtering, and reusable visualization primitives.
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
