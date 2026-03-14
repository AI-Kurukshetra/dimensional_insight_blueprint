export type AppRole =
  | "admin"
  | "executive"
  | "doctor"
  | "physician"
  | "analyst"
  | "viewer";
export type PlanTier = "growth" | "professional" | "enterprise";
export type AlertSeverity = "low" | "medium" | "high" | "critical";
export type AlertStatus = "new" | "acknowledged" | "resolved";
export type IntegrationStatus = "healthy" | "delayed" | "warning";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  planTier: PlanTier;
  payerFocus: string;
};

export type Facility = {
  id: string;
  organizationId: string;
  name: string;
  type: string;
  city: string;
  state: string;
  beds: number;
};

export type UserProfile = {
  id: string;
  fullName: string;
  email: string;
  title: string;
  role: AppRole;
  organizationId: string;
  defaultFacilityId?: string;
};

export type OrganizationMembership = {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: AppRole;
  defaultFacilityId?: string;
};

export type KpiMetric = {
  id: string;
  label: string;
  value: string;
  change: string;
  direction: "up" | "down";
  description: string;
};

export type TimeSeriesPoint = {
  label: string;
  value: number;
};

export type ModuleInsight = {
  id: string;
  title: string;
  description: string;
  value: string;
  trend: string;
};

export type ClinicalMetric = {
  id: string;
  name: string;
  current: number;
  target: number;
  unit: string;
  trend: "up" | "down" | "stable";
};

export type FinancialMetric = {
  id: string;
  name: string;
  current: string;
  target: string;
  note: string;
};

export type PopulationCohort = {
  id: string;
  cohort: string;
  members: number;
  completionRate: number;
  riskLevel: "low" | "moderate" | "high";
};

export type AlertItem = {
  id: string;
  organizationId: string;
  facilityId?: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  owner: string;
  timestamp: string;
  module: string;
};

export type IntegrationConnection = {
  id: string;
  organizationId: string;
  source: string;
  category: string;
  standard: string;
  status: IntegrationStatus;
  latencyMinutes: number;
  lastSync: string;
};

export type ReportExport = {
  id: string;
  title: string;
  format: "pdf" | "csv" | "xlsx";
  status: "ready" | "processing";
  createdAt: string;
  path?: string;
};

export type PatientRecord = {
  id: string;
  organizationId: string;
  facilityId: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  primaryCondition: string;
  riskLevel: "low" | "moderate" | "high";
};

export type ProviderRecord = {
  id: string;
  organizationId: string;
  facilityId: string;
  fullName: string;
  npi: string;
  specialty: string;
};

export type LabResultRecord = {
  id: string;
  patientId: string;
  testName: string;
  valueNumeric: number;
  abnormalFlag: boolean;
  collectedAt: string;
};

export type OverviewData = {
  organization: Organization;
  facilities: Facility[];
  user: UserProfile;
  executiveKpis: KpiMetric[];
  clinicalMetrics: ClinicalMetric[];
  financialMetrics: FinancialMetric[];
  populationCohorts: PopulationCohort[];
  alerts: AlertItem[];
  integrations: IntegrationConnection[];
  reportExports: ReportExport[];
  revenueSeries: TimeSeriesPoint[];
  qualitySeries: TimeSeriesPoint[];
  isDemo: boolean;
};
