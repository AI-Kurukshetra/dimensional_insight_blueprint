import { hasSupabaseAdminEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type AnySupabase = any;

type AuthUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

function getDefaultOrganizationName(user: AuthUserLike) {
  return (
    (typeof user.user_metadata?.organization_name === "string" &&
      user.user_metadata.organization_name.trim()) ||
    (typeof user.user_metadata?.full_name === "string" &&
      `${user.user_metadata.full_name.trim()} Practice`) ||
    `${(user.email ?? "healthscope-user").split("@")[0]} Health`
  );
}

function getDefaultOrganizationSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function extractUuid(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    return extractUuid(value[0]);
  }

  if (value && typeof value === "object") {
    const maybeId = (value as { id?: unknown; organization_id?: unknown }).organization_id;
    if (typeof maybeId === "string") {
      return maybeId;
    }

    const maybeValue = (value as { id?: unknown }).id;
    if (typeof maybeValue === "string") {
      return maybeValue;
    }
  }

  return null;
}

async function readOrganizationFromMembership(supabase: AnySupabase, userId: string) {
  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const fromOrganizationMembers = (member?.organization_id as string | undefined) ?? null;
  if (fromOrganizationMembers) {
    return fromOrganizationMembers;
  }

  // Legacy fallback for projects that still use organization_memberships.
  const legacyMembershipResult = await supabase
    .from("organization_memberships")
    .select("organization_id, role")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const fromLegacyMembership =
    (legacyMembershipResult.data?.organization_id as string | undefined) ?? null;
  if (fromLegacyMembership) {
    const role =
      typeof legacyMembershipResult.data?.role === "string" &&
      legacyMembershipResult.data.role.trim()
        ? legacyMembershipResult.data.role
        : "admin";

    // Keep the newer model in sync when permissions allow it.
    await supabase
      .from("organization_members")
      .upsert(
        {
          user_id: userId,
          organization_id: fromLegacyMembership,
          role
        } as any,
        { onConflict: "user_id,organization_id" }
      )
      .then(() => null)
      .catch(() => null);

    return fromLegacyMembership;
  }

  // Last-resort fallback for schemas that store assignment in public.users.
  let appUserResult = await supabase
    .from("users")
    .select("organization_id")
    .eq("auth_user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!appUserResult.data?.organization_id) {
    appUserResult = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", userId)
      .limit(1)
      .maybeSingle();
  }

  const fromUsersTable =
    (appUserResult.data?.organization_id as string | undefined) ?? null;
  if (fromUsersTable) {
    await supabase
      .from("organization_members")
      .upsert(
        {
          user_id: userId,
          organization_id: fromUsersTable,
          role: "admin"
        } as any,
        { onConflict: "user_id,organization_id" }
      )
      .then(() => null)
      .catch(() => null);

    return fromUsersTable;
  }

  return null;
}

async function ensureWithSessionClient(supabase: AnySupabase, user: AuthUserLike) {
  const result = await supabase
    .rpc("ensure_user_has_organization", {
      p_user_id: user.id,
      p_email: user.email ?? null,
      p_user_meta: user.user_metadata ?? {}
    })
    .then((value: unknown) => value as { data?: unknown; error?: unknown })
    .catch(() => null);

  if (!result || result.error) {
    return null;
  }

  return extractUuid(result.data);
}

async function upsertOrganizationMember(
  client: AnySupabase,
  userId: string,
  organizationId: string,
  role = "admin"
) {
  const orgMembersResult = await client
    .from("organization_members")
    .upsert(
      {
        user_id: userId,
        organization_id: organizationId,
        role
      } as any,
      { onConflict: "user_id,organization_id" }
    )
    .then((value: unknown) => value as { error?: unknown })
    .catch(() => null);

  const legacyResult = await client
    .from("organization_memberships")
    .upsert(
      {
        user_id: userId,
        organization_id: organizationId,
        role
      } as any,
      { onConflict: "user_id,organization_id" }
    )
    .then((value: unknown) => value as { error?: unknown })
    .catch(() => null);

  return Boolean(
    (orgMembersResult && !orgMembersResult.error) ||
      (legacyResult && !legacyResult.error)
  );
}

async function createOrganizationWithClient(client: AnySupabase, user: AuthUserLike) {
  const orgName = getDefaultOrganizationName(user);
  const orgSlug = getDefaultOrganizationSlug(orgName);

  const fromRpcResult = await client
    .rpc("upsert_healthcare_organization", {
      p_name: orgName,
      p_industry: "Healthcare",
      p_slug: orgSlug || null
    })
    .then((value: unknown) => value as { data?: unknown; error?: unknown })
    .catch(() => null);

  const fromRpc = extractUuid(fromRpcResult?.data);
  if (fromRpc) {
    return fromRpc;
  }

  const insertPayloads: Record<string, unknown>[] = [
    {
      id: crypto.randomUUID(),
      organization_id: null,
      name: orgName,
      slug: orgSlug || null,
      plan_tier: "growth",
      payer_focus: "Commercial",
      status: "active",
      metadata: {}
    },
    {
      id: crypto.randomUUID(),
      organization_id: null,
      name: orgName,
      slug: orgSlug || null,
      plan_tier: "growth",
      payer_focus: "Commercial"
    },
    {
      id: crypto.randomUUID(),
      organization_id: null,
      name: orgName,
      industry: "Healthcare"
    },
    {
      id: crypto.randomUUID(),
      organization_id: null,
      name: orgName
    },
    {
      name: orgName,
      industry: "Healthcare",
      slug: orgSlug || null,
      plan_tier: "growth",
      payer_focus: "Commercial",
      status: "active",
      metadata: {}
    },
    {
      name: orgName,
      slug: orgSlug || null,
      plan_tier: "growth",
      payer_focus: "Commercial"
    },
    {
      name: orgName,
      industry: "Healthcare"
    },
    {
      name: orgName
    }
  ];

  for (const payload of insertPayloads) {
    if (typeof payload.id === "string" && payload.organization_id === null) {
      payload.organization_id = payload.id;
    }
  }

  for (const payload of insertPayloads) {
    const insertResult = await client
      .from("organizations")
      .insert(payload as any)
      .select("id")
      .maybeSingle()
      .then((value: unknown) => value as { data?: { id?: string }; error?: unknown })
      .catch(() => null);

    if (insertResult?.data?.id) {
      return insertResult.data.id;
    }
  }

  const existingByName = await client
    .from("organizations")
    .select("id")
    .eq("name", orgName)
    .limit(1)
    .maybeSingle()
    .then((value: unknown) => value as { data?: { id?: string } })
    .catch(() => null);

  return existingByName?.data?.id ?? null;
}

async function ensureWithSessionFallback(supabase: AnySupabase, user: AuthUserLike) {
  let organizationId = await createOrganizationWithClient(supabase, user);

  if (!organizationId) {
    const existingOrganization = await supabase
      .from("organizations")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then((value: unknown) => value as { data?: { id?: string } })
      .catch(() => null);

    organizationId = existingOrganization?.data?.id ?? null;
  }

  if (!organizationId) {
    return null;
  }

  const assigned = await upsertOrganizationMember(
    supabase,
    user.id,
    organizationId,
    "admin"
  );
  return assigned ? organizationId : null;
}

async function ensureWithAdminClient(user: AuthUserLike) {
  if (!hasSupabaseAdminEnv()) {
    return null;
  }

  const admin = createAdminClient() as AnySupabase;
  if (!admin) {
    return null;
  }

  const ensureResult = await admin
    .rpc("ensure_user_has_organization", {
      p_user_id: user.id,
      p_email: user.email ?? null,
      p_user_meta: user.user_metadata ?? {}
    })
    .then((value: unknown) => value as { data?: unknown; error?: unknown })
    .catch(() => null);

  const fromEnsureRpc = extractUuid(ensureResult?.data);
  if (fromEnsureRpc) {
    return fromEnsureRpc;
  }

  const organizationId = await createOrganizationWithClient(admin, user);
  if (!organizationId) {
    return null;
  }

  const assigned = await upsertOrganizationMember(
    admin,
    user.id,
    organizationId,
    "admin"
  );

  if (!assigned) {
    return null;
  }

  return organizationId;
}

async function ensureUserExistsInOrganizationMembers(
  supabase: AnySupabase,
  user: AuthUserLike,
  organizationId: string
) {
  const assigned = await upsertOrganizationMember(
    supabase,
    user.id,
    organizationId,
    "admin"
  );

  if (assigned) {
    return organizationId;
  }

  const fromAdmin = await ensureWithAdminClient(user);
  if (fromAdmin) {
    return fromAdmin;
  }
  return organizationId;
}

/**
 * Guarantees a logged-in auth user has an organization assignment.
 * Prefers DB-side security-definer function and falls back to service-role admin when available.
 */
export async function ensureCurrentUserOrganization(params?: {
  supabase?: AnySupabase;
  user?: AuthUserLike | null;
}): Promise<string | null> {
  const supabase = (params?.supabase ?? ((await createClient()) as any)) as AnySupabase;

  let user = params?.user ?? null;
  if (!user) {
    const {
      data: { user: authUser }
    } = await supabase.auth.getUser();
    user = authUser;
  }

  if (!user) {
    return null;
  }

  const existing = await readOrganizationFromMembership(supabase, user.id);
  if (existing) {
    return ensureUserExistsInOrganizationMembers(supabase, user, existing);
  }

  const fromSession = await ensureWithSessionClient(supabase, user);
  if (fromSession) {
    return ensureUserExistsInOrganizationMembers(supabase, user, fromSession);
  }

  const fromSessionFallback = await ensureWithSessionFallback(supabase, user);
  if (fromSessionFallback) {
    return fromSessionFallback;
  }

  const fromAdmin = await ensureWithAdminClient(user);
  if (fromAdmin) {
    return fromAdmin;
  }

  return readOrganizationFromMembership(supabase, user.id);
}
