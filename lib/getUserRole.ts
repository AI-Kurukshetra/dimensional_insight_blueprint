import { createClient } from "@/lib/supabase/server";
import { normalizeRole, type NormalizedRole } from "@/lib/rbac";

type AnySupabase = any;

export type UserRoleContext = {
  userId: string;
  organizationId: string;
  role: NormalizedRole;
  rawRole: string;
};

async function getRoleFromRoleId(supabase: AnySupabase, roleId: string) {
  const roleBySlug = await supabase
    .from("roles")
    .select("role_slug, role_name")
    .eq("id", roleId)
    .limit(1)
    .maybeSingle();

  if (roleBySlug.data?.role_slug) {
    return roleBySlug.data.role_slug as string;
  }

  if (roleBySlug.data?.role_name) {
    return roleBySlug.data.role_name as string;
  }

  const roleByName = await supabase
    .from("roles")
    .select("slug, name")
    .eq("id", roleId)
    .limit(1)
    .maybeSingle();

  if (roleByName.data?.slug) {
    return roleByName.data.slug as string;
  }

  if (roleByName.data?.name) {
    return roleByName.data.name as string;
  }

  return null;
}

export async function getUserRole(params?: {
  supabase?: AnySupabase;
  userId?: string | null;
}): Promise<UserRoleContext | null> {
  const supabase = (params?.supabase ?? ((await createClient()) as any)) as AnySupabase;
  let userId = params?.userId ?? null;

  if (!userId) {
    const {
      data: { user }
    } = await supabase.auth.getUser();

    userId = user?.id ?? null;
  }

  if (!userId) {
    return null;
  }

  const orgMember = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const orgMemberRole = normalizeRole(orgMember.data?.role ?? null);
  if (orgMember.data?.organization_id && orgMemberRole) {
    return {
      userId,
      organizationId: orgMember.data.organization_id as string,
      role: orgMemberRole,
      rawRole: orgMember.data.role as string
    };
  }

  const membership = await supabase
    .from("organization_memberships")
    .select("organization_id, role")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const membershipRole = normalizeRole(membership.data?.role ?? null);
  if (membership.data?.organization_id && membershipRole) {
    return {
      userId,
      organizationId: membership.data.organization_id as string,
      role: membershipRole,
      rawRole: membership.data.role as string
    };
  }

  let appUser = await supabase
    .from("users")
    .select("id, organization_id, role_id")
    .eq("id", userId)
    .limit(1)
    .maybeSingle();

  if (!appUser.data) {
    // Some schemas use users.auth_user_id to map to auth.users.
    appUser = await supabase
      .from("users")
      .select("id, organization_id, role_id")
      .eq("auth_user_id", userId)
      .limit(1)
      .maybeSingle();
  }

  if (!appUser.data?.organization_id) {
    return null;
  }

  let rawRole = "viewer";
  if (appUser.data.role_id) {
    rawRole = (await getRoleFromRoleId(supabase, appUser.data.role_id as string)) ?? rawRole;
  } else {
    const userRole = await supabase
      .from("user_roles")
      .select("role_id")
      .eq("organization_id", appUser.data.organization_id)
      .eq("user_id", appUser.data.id)
      .order("is_primary", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (userRole.data?.role_id) {
      rawRole =
        (await getRoleFromRoleId(supabase, userRole.data.role_id as string)) ?? rawRole;
    }
  }

  const normalized = normalizeRole(rawRole);
  if (!normalized) {
    return null;
  }

  return {
    userId,
    organizationId: appUser.data.organization_id as string,
    role: normalized,
    rawRole
  };
}
