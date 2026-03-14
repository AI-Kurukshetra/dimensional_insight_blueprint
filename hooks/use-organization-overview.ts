"use client";

import { useQuery } from "@tanstack/react-query";
import type { OverviewData } from "@/lib/types";

export function useOrganizationOverview(
  organizationId: string,
  initialData?: OverviewData
) {
  return useQuery({
    queryKey: ["organization-overview", organizationId],
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${organizationId}/overview`);

      if (!response.ok) {
        throw new Error("Failed to fetch organization overview.");
      }

      return (await response.json()) as OverviewData;
    },
    initialData
  });
}
