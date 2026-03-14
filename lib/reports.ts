import { demoOverview } from "@/lib/demo-data";
import { createUploadUrl } from "@/lib/s3";

type ReportFormat = "csv" | "pdf" | "xlsx";

export async function generateReportExport(format: ReportFormat, title: string) {
  const key = `exports/${Date.now()}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${format}`;

  if (format === "csv") {
    const csv = [
      ["Metric", "Value", "Change"],
      ...demoOverview.executiveKpis.map((metric) => [metric.label, metric.value, metric.change])
    ]
      .map((row) => row.join(","))
      .join("\n");

    const uploadUrl = await createUploadUrl(key, "text/csv");

    return {
      key,
      uploadUrl,
      content: csv,
      contentType: "text/csv"
    };
  }

  const placeholder = `HealthScope ${format.toUpperCase()} export for ${title}`;
  const uploadUrl = await createUploadUrl(
    key,
    format === "pdf"
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  return {
    key,
    uploadUrl,
    content: placeholder,
    contentType:
      format === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  };
}
