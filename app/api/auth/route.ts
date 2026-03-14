import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";
import { getUserRole } from "@/lib/getUserRole";
import { getPermissionsForRole } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ mode: "demo", authenticated: false });
  }

  const supabase = (await createClient()) as any;
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ authenticated: false });
  }

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("organization_memberships")
      .select("id, organization_id, role, default_facility_id")
      .eq("user_id", user.id)
  ]);
  const roleContext = await getUserRole({ supabase, userId: user.id });
  const permissions = getPermissionsForRole(roleContext?.role ?? null);

  return NextResponse.json({
    authenticated: true,
    user,
    profile,
    memberships: memberships ?? [],
    role: roleContext?.role ?? null,
    permissions
  });
}

export async function DELETE() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ success: true });
  }

  const supabase = (await createClient()) as any;
  await supabase.auth.signOut();
  return NextResponse.json({ success: true });
}
