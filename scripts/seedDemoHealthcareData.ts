import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

type AdminClient = any;

type SeedOrganization = {
  name: string;
  slug: string;
  industry: string;
};

type SeedFacility = {
  organizationSlug: string;
  name: string;
  facilityType: string;
  city: string;
  state: string;
  bedCount: number;
};

type SeedProvider = {
  organizationSlug: string;
  facilityName: string;
  fullName: string;
  specialty: string;
  npi: string;
};

type SeedPatient = {
  organizationSlug: string;
  facilityName: string;
  fullName: string;
  dateOfBirth: string;
  gender: "Female" | "Male";
  primaryCondition: string;
  riskLevel: "low" | "moderate" | "high";
  insurance: string;
};

type SeedEncounter = {
  patientName: string;
  providerName: string;
  encounterType: "Outpatient" | "Emergency" | "Inpatient";
  diagnosisCode: string;
  diagnosisDescription: string;
  encounterDate: string;
  dischargeDate: string;
};

type SeedClaim = {
  claimNumber: string;
  patientName: string;
  amount: number;
  status: "Approved" | "Pending" | "Denied";
  serviceDate: string;
};

const ORGANIZATIONS: SeedOrganization[] = [
  {
    name: "River Valley Hospital",
    slug: "river-valley-hospital",
    industry: "Healthcare"
  },
  {
    name: "Evergreen Medical Center",
    slug: "evergreen-medical-center",
    industry: "Healthcare"
  }
];

const FACILITIES: SeedFacility[] = [
  {
    organizationSlug: "river-valley-hospital",
    name: "River Valley Main Hospital",
    facilityType: "General Hospital",
    city: "Austin",
    state: "TX",
    bedCount: 220
  },
  {
    organizationSlug: "evergreen-medical-center",
    name: "Evergreen Diagnostic Center",
    facilityType: "Diagnostic Center",
    city: "Seattle",
    state: "WA",
    bedCount: 95
  }
];

const PROVIDERS: SeedProvider[] = [
  {
    organizationSlug: "river-valley-hospital",
    facilityName: "River Valley Main Hospital",
    fullName: "Dr Olivia Patel",
    specialty: "Cardiology",
    npi: "1122334455"
  },
  {
    organizationSlug: "river-valley-hospital",
    facilityName: "River Valley Main Hospital",
    fullName: "Dr Daniel Kim",
    specialty: "Neurology",
    npi: "2233445566"
  }
];

const PATIENTS: SeedPatient[] = [
  {
    organizationSlug: "river-valley-hospital",
    facilityName: "River Valley Main Hospital",
    fullName: "Emma Wilson",
    dateOfBirth: "1989-03-12",
    gender: "Female",
    primaryCondition: "Hypertension",
    riskLevel: "moderate",
    insurance: "BlueCross"
  },
  {
    organizationSlug: "river-valley-hospital",
    facilityName: "River Valley Main Hospital",
    fullName: "Michael Carter",
    dateOfBirth: "1975-07-21",
    gender: "Male",
    primaryCondition: "Pneumonia",
    riskLevel: "high",
    insurance: "UnitedHealth"
  },
  {
    organizationSlug: "river-valley-hospital",
    facilityName: "River Valley Main Hospital",
    fullName: "Sophia Martinez",
    dateOfBirth: "1993-01-09",
    gender: "Female",
    primaryCondition: "Asthma",
    riskLevel: "moderate",
    insurance: "Aetna"
  },
  {
    organizationSlug: "river-valley-hospital",
    facilityName: "River Valley Main Hospital",
    fullName: "Noah Johnson",
    dateOfBirth: "1984-11-18",
    gender: "Male",
    primaryCondition: "Diabetes",
    riskLevel: "high",
    insurance: "Cigna"
  }
];

const ENCOUNTERS: SeedEncounter[] = [
  {
    patientName: "Emma Wilson",
    providerName: "Dr Olivia Patel",
    encounterType: "Outpatient",
    diagnosisCode: "I10",
    diagnosisDescription: "Hypertension",
    encounterDate: "2026-03-10T09:00:00.000Z",
    dischargeDate: "2026-03-10T10:30:00.000Z"
  },
  {
    patientName: "Michael Carter",
    providerName: "Dr Daniel Kim",
    encounterType: "Emergency",
    diagnosisCode: "J18.9",
    diagnosisDescription: "Pneumonia",
    encounterDate: "2026-03-11T02:30:00.000Z",
    dischargeDate: "2026-03-13T08:10:00.000Z"
  },
  {
    patientName: "Sophia Martinez",
    providerName: "Dr Olivia Patel",
    encounterType: "Outpatient",
    diagnosisCode: "J45.909",
    diagnosisDescription: "Asthma",
    encounterDate: "2026-03-12T13:00:00.000Z",
    dischargeDate: "2026-03-12T14:10:00.000Z"
  },
  {
    patientName: "Noah Johnson",
    providerName: "Dr Daniel Kim",
    encounterType: "Inpatient",
    diagnosisCode: "E11.9",
    diagnosisDescription: "Diabetes",
    encounterDate: "2026-03-09T08:00:00.000Z",
    dischargeDate: "2026-03-14T11:45:00.000Z"
  }
];

const CLAIMS: SeedClaim[] = [
  {
    claimNumber: "Claim1",
    patientName: "Emma Wilson",
    amount: 1250,
    status: "Approved",
    serviceDate: "2026-03-10"
  },
  {
    claimNumber: "Claim2",
    patientName: "Michael Carter",
    amount: 2300,
    status: "Pending",
    serviceDate: "2026-03-11"
  },
  {
    claimNumber: "Claim3",
    patientName: "Sophia Martinez",
    amount: 890,
    status: "Approved",
    serviceDate: "2026-03-12"
  },
  {
    claimNumber: "Claim4",
    patientName: "Noah Johnson",
    amount: 4100,
    status: "Denied",
    serviceDate: "2026-03-09"
  }
];

const DASHBOARDS = [
  {
    roleSlug: "executive",
    name: "Executive Dashboard",
    slug: "executive",
    description: "Executive healthcare KPI dashboard"
  },
  {
    roleSlug: "doctor",
    name: "Clinical Dashboard",
    slug: "clinical",
    description: "Clinical outcomes and diagnosis dashboard"
  },
  {
    roleSlug: "executive",
    name: "Financial Dashboard",
    slug: "financial",
    description: "Financial performance and claims dashboard"
  },
  {
    roleSlug: "executive",
    name: "Operational Dashboard",
    slug: "operational",
    description: "Operational throughput and staffing dashboard"
  }
];

async function ensureOrganization(admin: AdminClient, organization: SeedOrganization) {
  const existingBySlug = await admin
    .from("organizations")
    .select("id")
    .eq("slug", organization.slug)
    .limit(1)
    .maybeSingle();

  if (existingBySlug.data?.id) {
    return existingBySlug.data.id as string;
  }

  const existingByName = await admin
    .from("organizations")
    .select("id")
    .eq("name", organization.name)
    .limit(1)
    .maybeSingle();

  if (existingByName.data?.id) {
    return existingByName.data.id as string;
  }

  const rpcResult = await admin
    .rpc("upsert_healthcare_organization", {
      p_name: organization.name,
      p_industry: organization.industry,
      p_slug: organization.slug
    })
    .then((value: unknown) => value as { data?: string; error?: { message?: string } })
    .catch(() => null);

  if (rpcResult?.data) {
    return rpcResult.data;
  }

  const insertPayloads: Record<string, unknown>[] = [
    {
      name: organization.name,
      slug: organization.slug,
      plan_tier: "growth",
      payer_focus: "Commercial",
      industry: organization.industry,
      status: "active",
      metadata: {}
    },
    {
      name: organization.name,
      slug: organization.slug,
      plan_tier: "growth",
      payer_focus: "Commercial"
    },
    {
      name: organization.name
    }
  ];

  for (const payload of insertPayloads) {
    const insertResult = await admin
      .from("organizations")
      .insert(payload as any)
      .select("id")
      .maybeSingle();

    if (insertResult.data?.id) {
      return insertResult.data.id as string;
    }
  }

  throw new Error(`Unable to provision organization ${organization.name}`);
}

async function ensureFacility(
  admin: AdminClient,
  organizationId: string,
  facility: SeedFacility
) {
  const existing = await admin
    .from("facilities")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("name", facility.name)
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) {
    return existing.data.id as string;
  }

  const payload = {
    organization_id: organizationId,
    name: facility.name,
    facility_type: facility.facilityType,
    city: facility.city,
    state: facility.state,
    bed_count: facility.bedCount
  };

  const insertResult = await admin
    .from("facilities")
    .insert(payload as any)
    .select("id")
    .maybeSingle();

  if (!insertResult.data?.id) {
    throw new Error(`Unable to insert facility ${facility.name}`);
  }

  return insertResult.data.id as string;
}

async function ensureProvider(
  admin: AdminClient,
  organizationId: string,
  facilityId: string,
  provider: SeedProvider
) {
  const existing = await admin
    .from("providers")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("full_name", provider.fullName)
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) {
    return existing.data.id as string;
  }

  const insertResult = await admin
    .from("providers")
    .insert({
      organization_id: organizationId,
      facility_id: facilityId,
      full_name: provider.fullName,
      specialty: provider.specialty,
      npi: provider.npi
    } as any)
    .select("id")
    .maybeSingle();

  if (!insertResult.data?.id) {
    throw new Error(`Unable to insert provider ${provider.fullName}`);
  }

  return insertResult.data.id as string;
}

async function ensurePatient(
  admin: AdminClient,
  organizationId: string,
  facilityId: string,
  patient: SeedPatient
) {
  const existing = await admin
    .from("patients")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("full_name", patient.fullName)
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) {
    return existing.data.id as string;
  }

  const insertResult = await admin
    .from("patients")
    .insert({
      organization_id: organizationId,
      facility_id: facilityId,
      full_name: patient.fullName,
      date_of_birth: patient.dateOfBirth,
      gender: patient.gender,
      primary_condition: patient.primaryCondition,
      risk_level: patient.riskLevel
    } as any)
    .select("id")
    .maybeSingle();

  if (!insertResult.data?.id) {
    throw new Error(`Unable to insert patient ${patient.fullName}`);
  }

  return insertResult.data.id as string;
}

async function ensureEncounter(
  admin: AdminClient,
  organizationId: string,
  facilityId: string,
  patientId: string,
  providerId: string,
  encounter: SeedEncounter
) {
  const existing = await admin
    .from("clinical_encounters")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("patient_id", patientId)
    .eq("encounter_type", encounter.encounterType)
    .eq("encounter_date", encounter.encounterDate)
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) {
    return existing.data.id as string;
  }

  const insertResult = await admin
    .from("clinical_encounters")
    .insert({
      organization_id: organizationId,
      facility_id: facilityId,
      patient_id: patientId,
      provider_id: providerId,
      encounter_type: encounter.encounterType,
      encounter_date: encounter.encounterDate,
      discharge_date: encounter.dischargeDate,
      outcome: "stable",
      readmission_risk: encounter.encounterType === "Inpatient" ? 0.17 : 0.09
    } as any)
    .select("id")
    .maybeSingle();

  if (!insertResult.data?.id) {
    throw new Error(`Unable to insert encounter for ${encounter.patientName}`);
  }

  return insertResult.data.id as string;
}

async function ensureDiagnosis(admin: AdminClient, patientId: string, encounter: SeedEncounter) {
  const existing = await admin
    .from("diagnoses")
    .select("id")
    .eq("patient_id", patientId)
    .eq("description", encounter.diagnosisDescription)
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) {
    return;
  }

  await admin.from("diagnoses").insert({
    patient_id: patientId,
    code: encounter.diagnosisCode,
    description: encounter.diagnosisDescription
  } as any);
}

async function ensureLabResults(admin: AdminClient, patientId: string) {
  const tests = [
    { testName: "Blood Glucose", value: 106, abnormal: false },
    { testName: "Cholesterol", value: 212, abnormal: true },
    { testName: "Hemoglobin", value: 13.6, abnormal: false }
  ];

  for (const test of tests) {
    const existing = await admin
      .from("lab_results")
      .select("id")
      .eq("patient_id", patientId)
      .eq("test_name", test.testName)
      .limit(1)
      .maybeSingle();

    if (existing.data?.id) {
      continue;
    }

    await admin.from("lab_results").insert({
      patient_id: patientId,
      test_name: test.testName,
      value_numeric: test.value,
      abnormal_flag: test.abnormal,
      collected_at: new Date().toISOString()
    } as any);
  }
}

async function ensureClaim(
  admin: AdminClient,
  organizationId: string,
  facilityId: string,
  patientId: string,
  payerName: string,
  claim: SeedClaim
) {
  const existing = await admin
    .from("insurance_claims")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("claim_number", claim.claimNumber)
    .limit(1)
    .maybeSingle();

  if (existing.data?.id) {
    return existing.data.id as string;
  }

  const claimStatus = claim.status.toLowerCase();
  const paidAmount = claim.status === "Approved" ? claim.amount : 0;
  const denialAmount = claim.status === "Denied" ? claim.amount : 0;

  const insertResult = await admin
    .from("insurance_claims")
    .insert({
      organization_id: organizationId,
      facility_id: facilityId,
      patient_id: patientId,
      payer_name: payerName,
      claim_number: claim.claimNumber,
      billed_amount: claim.amount,
      paid_amount: paidAmount,
      denial_amount: denialAmount,
      claim_status: claimStatus,
      service_date: claim.serviceDate
    } as any)
    .select("id")
    .maybeSingle();

  if (!insertResult.data?.id) {
    throw new Error(`Unable to insert claim ${claim.claimNumber}`);
  }

  return insertResult.data.id as string;
}

async function ensureFinancialTransactions(
  admin: AdminClient,
  organizationId: string,
  facilityId: string
) {
  const departments = ["Cardiology", "Neurology", "Emergency"];

  for (const department of departments) {
    const existing = await admin
      .from("financial_transactions")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("note", `Department revenue - ${department}`)
      .limit(1)
      .maybeSingle();

    if (existing.data?.id) {
      continue;
    }

    await admin.from("financial_transactions").insert({
      organization_id: organizationId,
      facility_id: facilityId,
      transaction_type: "revenue",
      amount:
        department === "Cardiology"
          ? 250000
          : department === "Neurology"
            ? 210000
            : 285000,
      transaction_date: new Date().toISOString().slice(0, 10),
      reference_type: "department",
      reference_id: null,
      note: `Department revenue - ${department}`
    } as any);
  }
}

async function ensureDashboards(admin: AdminClient, organizationId: string) {
  for (const dashboard of DASHBOARDS) {
    const existing = await admin
      .from("dashboards")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("slug", dashboard.slug)
      .limit(1)
      .maybeSingle();

    if (existing.data?.id) {
      continue;
    }

    await admin.from("dashboards").insert({
      organization_id: organizationId,
      role_slug: dashboard.roleSlug,
      name: dashboard.name,
      slug: dashboard.slug,
      description: dashboard.description,
      status: "active",
      layout_config: {}
    } as any);
  }
}

async function ensureAlerts(admin: AdminClient, organizationId: string, facilityId: string) {
  const alerts = [
    {
      title: "High readmission rate",
      description: "Readmission rate exceeded threshold for monitored cohort.",
      module_name: "Clinical",
      severity: "high"
    },
    {
      title: "Claim denial rate",
      description: "Claim denial rate crossed configured financial threshold.",
      module_name: "Financial",
      severity: "critical"
    },
    {
      title: "Low bed availability",
      description: "Available bed capacity dropped below 20%.",
      module_name: "Operational",
      severity: "high"
    }
  ];

  for (const alert of alerts) {
    const existing = await admin
      .from("alerts")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("title", alert.title)
      .limit(1)
      .maybeSingle();

    if (existing.data?.id) {
      continue;
    }

    await admin.from("alerts").insert({
      organization_id: organizationId,
      facility_id: facilityId,
      module_name: alert.module_name,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      status: "new",
      owner_name: "HealthScope Monitor"
    } as any);
  }
}

async function run() {
  nextEnv.loadEnvConfig(process.cwd());

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const admin = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }) as AdminClient;

  const organizationIds = new Map<string, string>();
  for (const organization of ORGANIZATIONS) {
    const organizationId = await ensureOrganization(admin, organization);
    organizationIds.set(organization.slug, organizationId);
    console.log(`[seed-demo] organization ready: ${organization.name}`);
  }

  const facilityIds = new Map<string, string>();
  for (const facility of FACILITIES) {
    const organizationId = organizationIds.get(facility.organizationSlug);
    if (!organizationId) {
      throw new Error(`Missing organization for facility ${facility.name}`);
    }

    const facilityId = await ensureFacility(admin, organizationId, facility);
    facilityIds.set(facility.name, facilityId);
    console.log(`[seed-demo] facility ready: ${facility.name}`);
  }

  const providerIds = new Map<string, string>();
  for (const provider of PROVIDERS) {
    const organizationId = organizationIds.get(provider.organizationSlug);
    const facilityId = facilityIds.get(provider.facilityName);
    if (!organizationId || !facilityId) {
      throw new Error(`Missing organization/facility for provider ${provider.fullName}`);
    }

    const providerId = await ensureProvider(admin, organizationId, facilityId, provider);
    providerIds.set(provider.fullName, providerId);
    console.log(`[seed-demo] provider ready: ${provider.fullName}`);
  }

  const patientIds = new Map<string, string>();
  const patientInsurance = new Map<string, string>();
  for (const patient of PATIENTS) {
    const organizationId = organizationIds.get(patient.organizationSlug);
    const facilityId = facilityIds.get(patient.facilityName);
    if (!organizationId || !facilityId) {
      throw new Error(`Missing organization/facility for patient ${patient.fullName}`);
    }

    const patientId = await ensurePatient(admin, organizationId, facilityId, patient);
    patientIds.set(patient.fullName, patientId);
    patientInsurance.set(patient.fullName, patient.insurance);

    await ensureLabResults(admin, patientId);
    console.log(`[seed-demo] patient ready: ${patient.fullName}`);
  }

  for (const encounter of ENCOUNTERS) {
    const patientId = patientIds.get(encounter.patientName);
    const providerId = providerIds.get(encounter.providerName);
    const organizationId = organizationIds.get("river-valley-hospital");
    const facilityId = facilityIds.get("River Valley Main Hospital");

    if (!patientId || !providerId || !organizationId || !facilityId) {
      throw new Error(`Missing encounter dependencies for patient ${encounter.patientName}`);
    }

    await ensureEncounter(
      admin,
      organizationId,
      facilityId,
      patientId,
      providerId,
      encounter
    );
    await ensureDiagnosis(admin, patientId, encounter);
    console.log(`[seed-demo] encounter ready: ${encounter.patientName} (${encounter.encounterType})`);
  }

  const riverValleyOrganizationId = organizationIds.get("river-valley-hospital");
  const riverValleyFacilityId = facilityIds.get("River Valley Main Hospital");
  if (!riverValleyOrganizationId || !riverValleyFacilityId) {
    throw new Error("River Valley references are missing.");
  }

  for (const claim of CLAIMS) {
    const patientId = patientIds.get(claim.patientName);
    const payerName = patientInsurance.get(claim.patientName);
    if (!patientId || !payerName) {
      throw new Error(`Missing patient insurance context for claim ${claim.claimNumber}`);
    }

    await ensureClaim(
      admin,
      riverValleyOrganizationId,
      riverValleyFacilityId,
      patientId,
      payerName,
      claim
    );
    console.log(`[seed-demo] claim ready: ${claim.claimNumber}`);
  }

  await ensureFinancialTransactions(admin, riverValleyOrganizationId, riverValleyFacilityId);
  await ensureDashboards(admin, riverValleyOrganizationId);
  await ensureAlerts(admin, riverValleyOrganizationId, riverValleyFacilityId);

  const evergreenOrganizationId = organizationIds.get("evergreen-medical-center");
  const evergreenFacilityId = facilityIds.get("Evergreen Diagnostic Center");
  if (evergreenOrganizationId && evergreenFacilityId) {
    await ensureDashboards(admin, evergreenOrganizationId);
    await ensureAlerts(admin, evergreenOrganizationId, evergreenFacilityId);
  }

  console.log("[seed-demo] HealthScope demo healthcare data seeded successfully.");
}

run().catch((error) => {
  console.error("[seed-demo] failed", error);
  process.exit(1);
});
