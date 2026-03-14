import { redirect } from "next/navigation";
import { demoMemberships, demoOverview } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { ensureCurrentUserOrganization } from "@/lib/organization-assignment";
import { canAccess } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, OrganizationMembership, UserProfile } from "@/lib/types";

export async function getCurrentUser() {
  if (!hasSupabaseEnv()) {
    return {
      id: demoOverview.user.id,
      email: demoOverview.user.email
    };
  }

  const supabase = (await createClient()) as any;
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  if (!hasSupabaseEnv()) {
    return demoOverview.user;
  }

  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const supabase = (await createClient()) as any;
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  const { data: membership } = await supabase
    .from("organization_memberships")
    .select("*")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!profile || !membership) {
    return null;
  }

  return {
    id: user.id,
    fullName: profile.full_name,
    email: user.email ?? "",
    title: profile.title,
    role: membership.role,
    organizationId: membership.organization_id,
    defaultFacilityId: membership.default_facility_id ?? undefined
  };
}

export async function getMemberships(): Promise<OrganizationMembership[]> {
  if (!hasSupabaseEnv()) {
    return demoMemberships;
  }

  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  const supabase = (await createClient()) as any;
  const mapMemberships = (memberships: any[] | null | undefined) =>
    memberships?.map((membership: any) => ({
      id: membership.id,
      organizationId: membership.organization_id,
      organizationName:
        Array.isArray(membership.organizations)
          ? membership.organizations[0]?.name ?? ""
          : (membership.organizations as { name?: string } | null)?.name ?? "",
      organizationSlug:
        Array.isArray(membership.organizations)
          ? membership.organizations[0]?.slug ?? ""
          : (membership.organizations as { slug?: string } | null)?.slug ?? "",
      role: membership.role,
      defaultFacilityId: membership.default_facility_id ?? undefined
    })) ?? [];

  const fetchMemberships = async () => {
    const { data } = await supabase
      .from("organization_memberships")
      .select("id, organization_id, role, default_facility_id, organizations(name, slug)")
      .eq("user_id", user.id);

    return data as any[] | null;
  };

  const memberships = await fetchMemberships();

  const mappedMemberships = mapMemberships(memberships);

  if (!mappedMemberships.length) {
    // Fallback for the new organization_members model introduced by auth bootstrap.
    const { data: organizationMembers } = await supabase
      .from("organization_members")
      .select("id, organization_id, role, organizations(name, slug)")
      .eq("user_id", user.id);

    const fromOrganizationMembers =
      organizationMembers?.map((member: any) => ({
        id: member.id,
        organizationId: member.organization_id,
        organizationName:
          Array.isArray(member.organizations)
            ? member.organizations[0]?.name ?? ""
            : (member.organizations as { name?: string } | null)?.name ?? "",
        organizationSlug:
          Array.isArray(member.organizations)
            ? member.organizations[0]?.slug ?? ""
            : (member.organizations as { slug?: string } | null)?.slug ?? "",
        role: (["admin", "executive", "physician", "doctor", "analyst", "viewer"].includes(
          member.role
        )
          ? member.role
          : "admin") as AppRole,
        defaultFacilityId: undefined
      })) ?? [];

    if (fromOrganizationMembers.length) {
      return fromOrganizationMembers;
    }

    // Last resort: provision organization membership for accounts that were
    // created before org-assignment trigger was installed.
    const ensuredOrganizationId = await ensureCurrentUserOrganization({
      supabase,
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata
      }
    });

    if (ensuredOrganizationId) {
      const { data: refreshedMembers } = await supabase
        .from("organization_members")
        .select("id, organization_id, role, organizations(name, slug)")
        .eq("user_id", user.id);

      const refreshedFromOrganizationMembers =
        refreshedMembers?.map((member: any) => ({
          id: member.id,
          organizationId: member.organization_id,
          organizationName:
            Array.isArray(member.organizations)
              ? member.organizations[0]?.name ?? ""
              : (member.organizations as { name?: string } | null)?.name ?? "",
          organizationSlug:
            Array.isArray(member.organizations)
              ? member.organizations[0]?.slug ?? ""
              : (member.organizations as { slug?: string } | null)?.slug ?? "",
          role: (["admin", "executive", "physician", "doctor", "analyst", "viewer"].includes(
            member.role
          )
            ? member.role
            : "admin") as AppRole,
          defaultFacilityId: undefined
        })) ?? [];

      if (refreshedFromOrganizationMembers.length) {
        return refreshedFromOrganizationMembers;
      }
    }

    // Fallback for schemas that store tenant assignment in public.users/public.user_roles.
    let appUser = await supabase
      .from("users")
      .select("id, organization_id, role_id")
      .eq("auth_user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!appUser.data) {
      appUser = await supabase
        .from("users")
        .select("id, organization_id, role_id")
        .eq("id", user.id)
        .limit(1)
        .maybeSingle();
    }

    if (appUser.data?.organization_id) {
      const { data: organization } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .eq("id", appUser.data.organization_id)
        .limit(1)
        .maybeSingle();

      let roleSlug = "admin";

      if (appUser.data.role_id) {
        const { data: roleRecord } = await supabase
          .from("roles")
          .select("role_slug, role_name")
          .eq("id", appUser.data.role_id)
          .limit(1)
          .maybeSingle();

        roleSlug =
          (roleRecord?.role_slug as string | undefined) ??
          (roleRecord?.role_name as string | undefined) ??
          roleSlug;
      } else if (appUser.data.id) {
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role_id")
          .eq("organization_id", appUser.data.organization_id)
          .eq("user_id", appUser.data.id)
          .order("is_primary", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (userRole?.role_id) {
          const { data: roleRecord } = await supabase
            .from("roles")
            .select("role_slug, role_name")
            .eq("id", userRole.role_id)
            .limit(1)
            .maybeSingle();

          roleSlug =
            (roleRecord?.role_slug as string | undefined) ??
            (roleRecord?.role_name as string | undefined) ??
            roleSlug;
        }
      }

      const normalizedRole = roleSlug.toLowerCase();
      const mappedRole = (
        ["admin", "executive", "physician", "doctor", "analyst", "viewer"].includes(
          normalizedRole
        )
          ? normalizedRole
          : "admin"
      ) as AppRole;

      return [
        {
          id: appUser.data.id ?? `user-${user.id}`,
          organizationId: appUser.data.organization_id as string,
          organizationName:
            (organization?.name as string | undefined) ?? "Unknown organization",
          organizationSlug: (organization?.slug as string | undefined) ?? "",
          role: mappedRole,
          defaultFacilityId: undefined
        }
      ];
    }
  }

  const missingSlugOrgIds = mappedMemberships
    .filter((membership) => !membership.organizationSlug)
    .map((membership) => membership.organizationId);

  if (!missingSlugOrgIds.length) {
    return mappedMemberships;
  }

  const { data: organizations } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .in("id", missingSlugOrgIds);
  const organizationById = new Map<string, { name?: string; slug?: string }>(
    (organizations ?? []).map((organization: any) => [organization.id, organization])
  );

  return mappedMemberships.map((membership) => {
    if (membership.organizationSlug) {
      return membership;
    }

    const organization = organizationById.get(membership.organizationId);
    return {
      ...membership,
      organizationName: membership.organizationName || organization?.name || "",
      organizationSlug: organization?.slug ?? ""
    };
  });
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?message=Please sign in to continue.");
  }
  return user;
}

export async function requireOrganizationAccess(
  slug: string,
  minimumRole?: AppRole
) {
  const memberships = await getMemberships();
  const membership = memberships.find((item) => item.organizationSlug === slug);

  if (!membership) {
    const fallbackMembership = memberships.find((item) => item.organizationSlug);

    if (fallbackMembership?.organizationSlug) {
      redirect(`/org/${fallbackMembership.organizationSlug}/dashboard`);
    }

    redirect("/api/setup-user");
  }

  if (minimumRole && !canAccess(minimumRole, membership.role)) {
    redirect("/dashboard?message=Your role does not permit that action.");
  }

  return membership;
}

export async function getDefaultOrganizationSlug() {
  const memberships = await getMemberships();
  if (hasSupabaseEnv()) {
    if (!memberships[0]?.organizationSlug) {
      redirect("/api/setup-user");
    }
    return memberships[0].organizationSlug;
  }

  return memberships[0]?.organizationSlug ?? demoOverview.organization.slug;
}

export async function requireRole(minimumRole: AppRole) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login?message=Please sign in to continue.");
  }

  if (!canAccess(minimumRole, profile.role)) {
    redirect("/dashboard?message=Your role does not permit that action.");
  }

  return profile;
}

export async function requireAdmin() {
  return requireRole("admin");
}
