import { createClient } from "@/lib/supabase/server";

/**
 * Returns the current user's organization id from organization_members.
 * Returns null when the user is not logged in or has no assignment.
 */
export async function getUserOrganization(): Promise<string | null> {
  const supabase = (await createClient()) as any;
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (member?.organization_id) {
    return member.organization_id as string;
  }

  const { data: legacyMembership } = await supabase
    .from("organization_memberships")
    .select("organization_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (legacyMembership?.organization_id) {
    return legacyMembership.organization_id as string;
  }

  let appUser = await supabase
    .from("users")
    .select("organization_id")
    .eq("auth_user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!appUser.data?.organization_id) {
    appUser = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .limit(1)
      .maybeSingle();
  }

  return (appUser.data?.organization_id as string | undefined) ?? null;
}
