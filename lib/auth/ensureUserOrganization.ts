type AnySupabase = any;

type AuthUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

function toDisplayName(user: AuthUserLike) {
  const fromMetadata =
    (typeof user.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name.trim()) ||
    (typeof user.user_metadata?.name === "string" &&
      user.user_metadata.name.trim());

  if (fromMetadata) {
    return fromMetadata;
  }

  const fallback = (user.email ?? "user").split("@")[0];
  return fallback
    .split(/[._-]+/g)
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function toSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeLegacyRole(role: unknown) {
  const value = typeof role === "string" ? role.toLowerCase() : "";

  if (value === "physician") {
    return "doctor";
  }
  if (value === "executive" || value === "doctor" || value === "analyst" || value === "viewer") {
    return value;
  }
  return "admin";
}

async function createOrganization(supabase: AnySupabase, organizationName: string) {
  const rpcResult = await supabase
    .rpc("upsert_healthcare_organization", {
      p_name: organizationName,
      p_industry: "Healthcare",
      p_slug: toSlug(organizationName)
    })
    .then((value: unknown) => value as { data?: unknown; error?: unknown })
    .catch(() => null);

  if (typeof rpcResult?.data === "string") {
    return rpcResult.data;
  }

  const existingByName = await supabase
    .from("organizations")
    .select("id")
    .eq("name", organizationName)
    .limit(1)
    .maybeSingle()
    .then((value: unknown) => value as { data?: { id?: string } })
    .catch(() => null);

  if (existingByName?.data?.id) {
    return existingByName.data.id;
  }

  const slug = `${toSlug(organizationName)}-${crypto.randomUUID().slice(0, 8)}`;

  const payloads: Record<string, unknown>[] = [
    {
      id: crypto.randomUUID(),
      organization_id: null,
      name: organizationName,
      slug,
      plan_tier: "growth",
      payer_focus: "Commercial"
    },
    {
      id: crypto.randomUUID(),
      organization_id: null,
      name: organizationName,
      slug
    },
    {
      id: crypto.randomUUID(),
      organization_id: null,
      name: organizationName
    },
    { name: organizationName },
    { name: organizationName, slug },
    { name: organizationName, slug, plan_tier: "growth", payer_focus: "Commercial" },
    { name: organizationName, industry: "Healthcare" }
  ];

  for (const payload of payloads) {
    if (typeof payload.id === "string" && payload.organization_id === null) {
      payload.organization_id = payload.id;
    }
  }

  for (const payload of payloads) {
    const insertResult = await supabase
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

  const fallbackLookup = await supabase
    .from("organizations")
    .select("id")
    .eq("name", organizationName)
    .limit(1)
    .maybeSingle()
    .then((value: unknown) => value as { data?: { id?: string } })
    .catch(() => null);

  return fallbackLookup?.data?.id ?? null;
}

export async function ensureUserOrganization(params: {
  supabase: AnySupabase;
  user?: AuthUserLike | null;
}): Promise<string | null> {
  const supabase = params.supabase;
  let user = params.user ?? null;

  if (!user) {
    const {
      data: { user: authUser }
    } = (await supabase.auth.getUser()) as { data: { user: AuthUserLike | null } };
    user = authUser;
  }

  if (!user) {
    return null;
  }

  const existingMembership = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .order("created_at", { ascending: true })
    .maybeSingle()
    .then((value: unknown) => value as { data?: { organization_id?: string; role?: unknown } })
    .catch(() => null);

  if (existingMembership?.data?.organization_id) {
    const existingRole = normalizeLegacyRole((existingMembership.data as { role?: unknown }).role);
    await supabase
      .from("organization_memberships")
      .upsert(
        {
          user_id: user.id,
          organization_id: existingMembership.data.organization_id,
          role: existingRole
        } as any,
        { onConflict: "user_id,organization_id" }
      )
      .then(() => null)
      .catch(() => null);

    return existingMembership.data.organization_id;
  }

  const legacyMembership = await supabase
    .from("organization_memberships")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
    .then(
      (value: unknown) =>
        value as { data?: { organization_id?: string; role?: string | null } }
    )
    .catch(() => null);

  if (legacyMembership?.data?.organization_id) {
    const legacyOrganizationId = legacyMembership.data.organization_id;
    await supabase
      .from("organization_members")
      .upsert(
        {
          user_id: user.id,
          organization_id: legacyOrganizationId,
          role: normalizeLegacyRole(legacyMembership.data.role)
        } as any,
        { onConflict: "user_id,organization_id" }
      )
      .then(() => null)
      .catch(() => null);

    return legacyOrganizationId;
  }

  const organizationName = `${toDisplayName(user)}'s Healthcare Organization`;
  const organizationId = await createOrganization(supabase, organizationName);

  if (!organizationId) {
    return null;
  }

  await supabase
    .from("organization_members")
    .upsert(
      {
        user_id: user.id,
        organization_id: organizationId,
        role: "admin"
      } as any,
      { onConflict: "user_id,organization_id" }
    )
    .then(() => null)
    .catch(() => null);

  const verifyMembership = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("organization_id", organizationId)
    .limit(1)
    .maybeSingle()
    .then((value: unknown) => value as { data?: { organization_id?: string } })
    .catch(() => null);

  if (verifyMembership?.data?.organization_id) {
    return verifyMembership.data.organization_id;
  }

  const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!adminUrl || !serviceRoleKey) {
    return null;
  }

  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(adminUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }) as AnySupabase;

  const adminOrganizationId = await createOrganization(admin, organizationName);
  if (!adminOrganizationId) {
    return null;
  }

  await admin
    .from("organization_members")
    .upsert(
      {
        user_id: user.id,
        organization_id: adminOrganizationId,
        role: "admin"
      } as any,
      { onConflict: "user_id,organization_id" }
    )
    .then(() => null)
    .catch(() => null);

  await admin
    .from("organization_memberships")
    .upsert(
      {
        user_id: user.id,
        organization_id: adminOrganizationId,
        role: "admin"
      } as any,
      { onConflict: "user_id,organization_id" }
    )
    .then(() => null)
    .catch(() => null);

  const verifyAdminMembership = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("organization_id", adminOrganizationId)
    .limit(1)
    .maybeSingle()
    .then((value: unknown) => value as { data?: { organization_id?: string } })
    .catch(() => null);

  return verifyAdminMembership?.data?.organization_id ?? adminOrganizationId;
}
