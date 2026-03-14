import { createAdminClient } from "@/lib/supabase/admin";

type AuthUserLike = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

type OrganizationProvisionResult = {
  organizationId: string;
  organizationSlug: string | null;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getOrganizationSlugFromRelation(organizationRelation: unknown) {
  if (Array.isArray(organizationRelation)) {
    return (organizationRelation[0] as { slug?: string } | undefined)?.slug ?? null;
  }

  return (organizationRelation as { slug?: string } | null)?.slug ?? null;
}

export async function ensureUserOrganization(
  user: AuthUserLike
): Promise<OrganizationProvisionResult | null> {
  const admin = createAdminClient() as any;
  if (!admin) {
    return null;
  }

  const { data: existingMemberships } = await admin
    .from("organization_memberships")
    .select("organization_id, organizations(slug)")
    .eq("user_id", user.id)
    .limit(1);

  const existingMembership = existingMemberships?.[0] as
    | { organization_id?: string; organizations?: unknown }
    | undefined;

  if (existingMembership?.organization_id) {
    return {
      organizationId: existingMembership.organization_id,
      organizationSlug: getOrganizationSlugFromRelation(existingMembership.organizations)
    };
  }

  let organization = null as { id: string; slug?: string | null } | null;

  const { data: defaultOrganization } = await admin
    .from("organizations")
    .select("id, slug")
    .order("name", { ascending: true })
    .limit(1)
    .maybeSingle();

  organization = defaultOrganization as { id: string; slug?: string | null } | null;

  if (!organization?.id) {
    const emailPrefix = (user.email ?? "organization").split("@")[0] || "organization";
    const metaName =
      (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
      null;
    const orgName = `${metaName ?? emailPrefix} Organization`;
    const slugBase = slugify(orgName) || "organization";
    const uniqueSuffix = user.id.replace(/-/g, "").slice(0, 8);
    const orgSlug = `${slugBase}-${uniqueSuffix}`;

    const { data: createdOrganization } = await admin
      .from("organizations")
      .insert({
        name: orgName,
        slug: orgSlug,
        plan_tier: "growth",
        payer_focus: "Commercial"
      } as any)
      .select("id, slug")
      .maybeSingle();

    organization = createdOrganization as { id: string; slug?: string | null } | null;

    if (!organization?.id) {
      const { data: existingBySlug } = await admin
        .from("organizations")
        .select("id, slug")
        .eq("slug", orgSlug)
        .limit(1)
        .maybeSingle();

      organization = existingBySlug as { id: string; slug?: string | null } | null;
    }
  }

  if (!organization?.id) {
    return null;
  }

  const { data: defaultFacility } = await admin
    .from("facilities")
    .select("id")
    .eq("organization_id", organization.id)
    .order("name", { ascending: true })
    .limit(1)
    .maybeSingle();

  await admin.from("organization_memberships").upsert(
    {
      user_id: user.id,
      organization_id: organization.id,
      role: "admin",
      default_facility_id: defaultFacility?.id ?? null
    } as any,
    { onConflict: "user_id,organization_id" }
  );

  return {
    organizationId: organization.id,
    organizationSlug: organization.slug ?? null
  };
}
