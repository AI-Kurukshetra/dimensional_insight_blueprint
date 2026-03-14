import type {
  LabResultRecord,
  OrganizationMembership,
  OverviewData,
  PatientRecord,
  ProviderRecord
} from "@/lib/types";

export const demoOverview: OverviewData = {
  isDemo: true,
  organization: {
    id: "org-healthscope-demo",
    name: "NorthStar Health Network",
    slug: "northstar-health-network",
    planTier: "enterprise",
    payerFocus: "Commercial + Medicare Advantage"
  },
  facilities: [
    {
      id: "facility-seattle",
      organizationId: "org-healthscope-demo",
      name: "NorthStar Medical Center",
      type: "Acute Care Hospital",
      city: "Seattle",
      state: "WA",
      beds: 340
    },
    {
      id: "facility-bellevue",
      organizationId: "org-healthscope-demo",
      name: "NorthStar Specialty Pavilion",
      type: "Specialty Clinic",
      city: "Bellevue",
      state: "WA",
      beds: 88
    }
  ],
  user: {
    id: "demo-user-1",
    fullName: "Avery Morgan",
    email: "avery@healthscope.ai",
    title: "Vice President, Analytics",
    role: "executive",
    organizationId: "org-healthscope-demo",
    defaultFacilityId: "facility-seattle"
  },
  executiveKpis: [
    {
      id: "kpi-1",
      label: "30-day readmissions",
      value: "8.4%",
      change: "-1.2 pts",
      direction: "down",
      description: "All-cause across enterprise inpatient discharges"
    },
    {
      id: "kpi-2",
      label: "Net collection rate",
      value: "95.8%",
      change: "+0.6 pts",
      direction: "up",
      description: "Revenue cycle performance against target"
    },
    {
      id: "kpi-3",
      label: "High-risk patients",
      value: "2,148",
      change: "+148",
      direction: "up",
      description: "Attributed members requiring active outreach"
    },
    {
      id: "kpi-4",
      label: "FHIR feed uptime",
      value: "99.92%",
      change: "+0.03 pts",
      direction: "up",
      description: "Integration hub reliability across connected systems"
    }
  ],
  clinicalMetrics: [
    { id: "c1", name: "Sepsis bundle compliance", current: 78, target: 85, unit: "%", trend: "up" },
    { id: "c2", name: "Medication reconciliation", current: 91, target: 95, unit: "%", trend: "stable" },
    { id: "c3", name: "Average length of stay", current: 4.6, target: 4.3, unit: "days", trend: "down" }
  ],
  financialMetrics: [
    {
      id: "f1",
      name: "Denied claims",
      current: "4.9%",
      target: "< 4.0%",
      note: "MRI prior auth denials remain elevated"
    },
    {
      id: "f2",
      name: "Margin per case",
      current: "$1,842",
      target: "$1,700",
      note: "Strong surgical line performance"
    },
    {
      id: "f3",
      name: "Days in A/R",
      current: "39.2",
      target: "< 42",
      note: "Trending favorably after coding workflow updates"
    }
  ],
  populationCohorts: [
    { id: "p1", cohort: "CHF high-risk cohort", members: 342, completionRate: 71, riskLevel: "high" },
    { id: "p2", cohort: "Diabetes care gap outreach", members: 1188, completionRate: 64, riskLevel: "moderate" },
    { id: "p3", cohort: "Preventive screening outreach", members: 4860, completionRate: 82, riskLevel: "low" }
  ],
  alerts: [
    {
      id: "a1",
      organizationId: "org-healthscope-demo",
      facilityId: "facility-seattle",
      title: "Imaging denial rate breached threshold",
      description: "Commercial payer denials exceeded 6% for advanced imaging over the past 48 hours.",
      severity: "high",
      status: "new",
      owner: "Revenue Cycle Director",
      timestamp: "2026-03-14T07:10:00.000Z",
      module: "Financial"
    },
    {
      id: "a2",
      organizationId: "org-healthscope-demo",
      facilityId: "facility-seattle",
      title: "Readmission cohort risk rising",
      description: "Cardiology discharges with readmission risk over 0.7 increased by 11% week over week.",
      severity: "critical",
      status: "acknowledged",
      owner: "Population Health Lead",
      timestamp: "2026-03-14T06:15:00.000Z",
      module: "Population"
    },
    {
      id: "a3",
      organizationId: "org-healthscope-demo",
      facilityId: "facility-bellevue",
      title: "FHIR encounter feed latency warning",
      description: "Encounter resource sync exceeded the 15 minute SLA for two consecutive cycles.",
      severity: "medium",
      status: "new",
      owner: "Integration Engineering",
      timestamp: "2026-03-14T05:42:00.000Z",
      module: "Integrations"
    }
  ],
  integrations: [
    {
      id: "i1",
      organizationId: "org-healthscope-demo",
      source: "Epic Inpatient",
      category: "EHR",
      standard: "FHIR R4",
      status: "healthy",
      latencyMinutes: 3,
      lastSync: "2026-03-14T07:20:00.000Z"
    },
    {
      id: "i2",
      organizationId: "org-healthscope-demo",
      source: "Cerner Ambulatory",
      category: "EHR",
      standard: "HL7 v2 / FHIR",
      status: "healthy",
      latencyMinutes: 8,
      lastSync: "2026-03-14T07:14:00.000Z"
    },
    {
      id: "i3",
      organizationId: "org-healthscope-demo",
      source: "Claims Clearinghouse",
      category: "Financial",
      standard: "X12",
      status: "warning",
      latencyMinutes: 58,
      lastSync: "2026-03-14T06:31:00.000Z"
    }
  ],
  reportExports: [
    {
      id: "r1",
      title: "Executive Board Packet - March 2026",
      format: "pdf",
      status: "ready",
      createdAt: "2026-03-13T18:00:00.000Z",
      path: "exports/board-packet-mar-2026.pdf"
    },
    {
      id: "r2",
      title: "Population Health Outreach List",
      format: "csv",
      status: "processing",
      createdAt: "2026-03-14T07:12:00.000Z"
    }
  ],
  revenueSeries: [
    { label: "Oct", value: 8.1 },
    { label: "Nov", value: 8.4 },
    { label: "Dec", value: 8.7 },
    { label: "Jan", value: 8.9 },
    { label: "Feb", value: 9.2 },
    { label: "Mar", value: 9.4 }
  ],
  qualitySeries: [
    { label: "Week 1", value: 72 },
    { label: "Week 2", value: 74 },
    { label: "Week 3", value: 76 },
    { label: "Week 4", value: 79 },
    { label: "Week 5", value: 78 },
    { label: "Week 6", value: 81 }
  ]
};

export const demoMemberships: OrganizationMembership[] = [
  {
    id: "membership-demo-1",
    organizationId: demoOverview.organization.id,
    organizationName: demoOverview.organization.name,
    organizationSlug: demoOverview.organization.slug,
    role: demoOverview.user.role,
    defaultFacilityId: demoOverview.user.defaultFacilityId
  }
];

export const demoPatients: PatientRecord[] = [
  {
    id: "patient-1",
    organizationId: demoOverview.organization.id,
    facilityId: "facility-seattle",
    fullName: "Ruth Campbell",
    dateOfBirth: "1951-04-10",
    gender: "Female",
    primaryCondition: "Congestive heart failure",
    riskLevel: "high"
  },
  {
    id: "patient-2",
    organizationId: demoOverview.organization.id,
    facilityId: "facility-seattle",
    fullName: "Darren Ellis",
    dateOfBirth: "1968-11-23",
    gender: "Male",
    primaryCondition: "Type 2 diabetes",
    riskLevel: "moderate"
  },
  {
    id: "patient-3",
    organizationId: demoOverview.organization.id,
    facilityId: "facility-bellevue",
    fullName: "Priya Nair",
    dateOfBirth: "1978-02-05",
    gender: "Female",
    primaryCondition: "COPD",
    riskLevel: "high"
  }
];

export const demoProviders: ProviderRecord[] = [
  {
    id: "provider-1",
    organizationId: demoOverview.organization.id,
    facilityId: "facility-seattle",
    fullName: "Dr. Helena Ford",
    npi: "1245600012",
    specialty: "Cardiology"
  },
  {
    id: "provider-2",
    organizationId: demoOverview.organization.id,
    facilityId: "facility-seattle",
    fullName: "Dr. Omar Benson",
    npi: "1245600013",
    specialty: "Internal Medicine"
  },
  {
    id: "provider-3",
    organizationId: demoOverview.organization.id,
    facilityId: "facility-bellevue",
    fullName: "Dr. Nina Patel",
    npi: "1245600014",
    specialty: "Pulmonology"
  }
];

export const demoLabResults: LabResultRecord[] = [
  {
    id: "lab-1",
    patientId: "patient-1",
    testName: "BNP",
    valueNumeric: 620,
    abnormalFlag: true,
    collectedAt: "2026-03-14T06:00:00.000Z"
  },
  {
    id: "lab-2",
    patientId: "patient-2",
    testName: "HbA1c",
    valueNumeric: 8.4,
    abnormalFlag: true,
    collectedAt: "2026-03-13T13:30:00.000Z"
  },
  {
    id: "lab-3",
    patientId: "patient-3",
    testName: "SpO2",
    valueNumeric: 95,
    abnormalFlag: false,
    collectedAt: "2026-03-14T05:20:00.000Z"
  }
];
