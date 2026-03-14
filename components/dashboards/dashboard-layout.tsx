import { Badge } from "@/components/ui/badge";

export function DashboardLayout({
  title,
  description,
  badge,
  actions,
  children
}: {
  title: string;
  description: string;
  badge?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-semibold">{title}</h2>
            {badge ? <Badge variant="outline">{badge}</Badge> : null}
          </div>
          <p className="mt-2 max-w-3xl text-muted-foreground">{description}</p>
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}
