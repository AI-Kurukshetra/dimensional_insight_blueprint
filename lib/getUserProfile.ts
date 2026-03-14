import { getUserRole } from "@/lib/getUserRole";
import { createClient } from "@/lib/supabase/server";

type AnySupabase = any;

export type LoggedInUserProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId: string;
  organizationName: string;
  lastLoginAt: string | null;
};

function toDisplayName(input: string) {
  return input
    .split(/[._-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function roleLabel(role: string) {
  const normalized = role.toLowerCase();
  if (normalized === "physician") {
    return "Doctor";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function relationName(value: unknown): string | null {
  if (Array.isArray(value)) {
    const first = value[0] as { name?: unknown } | undefined;
    return typeof first?.name === "string" ? first.name : null;
  }

  if (value && typeof value === "object") {
    const named = value as { name?: unknown };
    return typeof named.name === "string" ? named.name : null;
  }

  return null;
}

export async function getUserProfile(): Promise<LoggedInUserProfile | null> {
  const supabase = (await createClient()) as AnySupabase;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const fallbackName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    toDisplayName((user.email ?? "healthscope-user").split("@")[0]);

  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id, role, organizations(name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const roleContext = await getUserRole({ supabase, userId: user.id });

  let organizationId = (member?.organization_id as string | undefined) ?? roleContext?.organizationId;
  let organizationName = relationName(member?.organizations) ?? "";
  let role =
    (typeof member?.role === "string" && member.role) ||
    roleContext?.rawRole ||
    roleContext?.role ||
    "viewer";

  if (!organizationId) {
    const { data: legacyMembership } = await supabase
      .from("organization_memberships")
      .select("organization_id, role, organizations(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    organizationId =
      (legacyMembership?.organization_id as string | undefined) ?? organizationId;
    organizationName = relationName(legacyMembership?.organizations) ?? organizationName;
    role =
      (typeof legacyMembership?.role === "string" && legacyMembership.role) ||
      role;
  }

  if (!organizationId) {
    return null;
  }

  if (!organizationName) {
    const { data: organization } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .limit(1)
      .maybeSingle();

    organizationName = (organization?.name as string | undefined) ?? "Unknown organization";
  }

  let appUserProfile = await supabase
    .from("users")
    .select("full_name, last_login")
    .eq("id", user.id)
    .limit(1)
    .maybeSingle();

  if (!appUserProfile.data) {
    appUserProfile = await supabase
      .from("users")
      .select("full_name, last_login")
      .eq("auth_user_id", user.id)
      .limit(1)
      .maybeSingle();
  }

  const fullName = (appUserProfile.data?.full_name as string | undefined) ?? fallbackName;
  const lastLoginAt =
    (appUserProfile.data?.last_login as string | undefined) ??
    user.last_sign_in_at ??
    null;

  return {
    id: user.id,
    name: fullName,
    email: user.email ?? "",
    role: roleLabel(role),
    organizationId,
    organizationName,
    lastLoginAt
  };
}
