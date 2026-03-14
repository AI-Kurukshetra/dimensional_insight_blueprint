import { NextResponse } from "next/server";
import { getUserRole } from "@/lib/getUserRole";
import { createClient } from "@/lib/supabase/server";

export async function resolveTenantContext() {
  const supabase = (await createClient()) as any;
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const roleContext = await getUserRole({ supabase, userId: user.id });
  if (!roleContext) {
    return {
      error: NextResponse.json({ error: "No organization role assignment found" }, { status: 403 })
    };
  }

  const { data: membership } = await supabase
    .from("organization_memberships")
    .select("default_facility_id")
    .eq("user_id", user.id)
    .eq("organization_id", roleContext.organizationId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    supabase,
    user,
    organizationId: roleContext.organizationId,
    role: roleContext.role,
    defaultFacilityId: (membership.default_facility_id as string | null) ?? null
  };
}
