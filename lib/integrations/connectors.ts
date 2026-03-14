import { z } from "zod";

const baseConnectorSchema = z.object({
  organizationId: z.string(),
  endpoint: z.string().url(),
  accessToken: z.string().min(1)
});

export const fhirConnectorSchema = baseConnectorSchema.extend({
  resourceType: z.enum(["Patient", "Observation", "Encounter", "Claim"])
});

export const ehrConnectorSchema = baseConnectorSchema.extend({
  vendor: z.enum(["Epic", "Cerner"]),
  since: z.string().optional()
});

export function buildConnectorJob(kind: "fhir" | "epic" | "cerner", payload: unknown) {
  if (kind === "fhir") {
    const parsed = fhirConnectorSchema.parse(payload);
    return {
      kind,
      status: "queued",
      normalizedTarget: parsed.resourceType,
      endpoint: parsed.endpoint
    };
  }

  const parsed = ehrConnectorSchema.parse(payload);
  return {
    kind,
    status: "queued",
    vendor: parsed.vendor,
    endpoint: parsed.endpoint
  };
}
