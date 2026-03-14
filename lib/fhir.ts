export type FhirSyncPayload = {
  resourceType: "Patient" | "Encounter" | "Observation" | "Claim";
  vendor: string;
  endpoint: string;
};

export function buildFhirSyncMessage(payload: FhirSyncPayload) {
  return {
    status: "queued",
    mode: "simulated",
    message: `FHIR ${payload.resourceType} sync prepared for ${payload.vendor}.`,
    endpoint: payload.endpoint
  };
}
