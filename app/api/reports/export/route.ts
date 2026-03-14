import { NextResponse } from "next/server";
import { z } from "zod";
import { generateReportExport } from "@/lib/reports";
import { resolveTenantContext } from "@/lib/api";

const schema = z.object({
  title: z.string(),
  format: z.enum(["csv", "pdf", "xlsx"])
});

export async function POST(request: Request) {
  const context = await resolveTenantContext();
  if ("error" in context) {
    return context.error;
  }

  const { title, format } = schema.parse(await request.json());
  const result = await generateReportExport(format, title);

  await context.supabase.from("report_exports").insert({
    organization_id: context.organizationId,
    report_id: null,
    title,
    export_format: format,
    status: result.uploadUrl ? "processing" : "ready",
    storage_path: result.key
  } as any);

  await context.supabase.from("user_events").insert({
    organization_id: context.organizationId,
    user_id: context.user.id,
    event_type: "report_export",
    event_name: "Report Export Requested",
    dashboard_slug: "executive",
    payload: {
      format,
      title
    },
    occurred_at: new Date().toISOString()
  } as any);

  return NextResponse.json({
    message: result.uploadUrl
      ? `Prepared ${format.toUpperCase()} export upload for S3.`
      : `Prepared ${format.toUpperCase()} export in demo mode. Add AWS env vars to upload to S3.`,
    key: result.key
  });
}
