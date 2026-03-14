"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ReportExportActions() {
  const [message, setMessage] = useState<string | null>(null);

  async function exportReport(format: "csv" | "pdf" | "xlsx") {
    setMessage("Generating export...");
    const response = await fetch("/api/reports/export", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: "Financial Analytics Pack",
        format
      })
    });

    const data = await response.json();
    setMessage(data.message ?? `Prepared ${format.toUpperCase()} export.`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" onClick={() => exportReport("csv")}>
        Export CSV
      </Button>
      <Button variant="outline" onClick={() => exportReport("xlsx")}>
        Export Excel
      </Button>
      <Button onClick={() => exportReport("pdf")}>Export PDF</Button>
      {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
    </div>
  );
}
