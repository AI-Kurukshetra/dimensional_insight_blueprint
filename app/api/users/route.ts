import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logActivity } from "@/lib/activity";
import { checkPermission } from "@/lib/checkPermission";
import { RBAC_PERMISSIONS } from "@/lib/rbac";

export async function GET() {
  const permission = await checkPermission(RBAC_PERMISSIONS.manageUsers);
  if ("error" in permission) {
    return permission.error;
  }

  const { supabase, organizationId, user } = permission;
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, status, last_login, role_id, facility_id")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
    supabase,
    userId: user.id,
    organizationId,
    action: "users.list",
    resourceType: "user",
    metadata: { count: data?.length ?? 0 }
  });

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const permission = await checkPermission(RBAC_PERMISSIONS.manageUsers);
  if ("error" in permission) {
    return permission.error;
  }

  const { organizationId, user } = permission;
  const body = (await request.json()) as {
    email: string;
    password: string;
    fullName: string;
    roleId?: string;
    facilityId?: string;
    status?: "active" | "inactive";
  };

  const admin = createAdminClient() as any;
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "SUPABASE_SERVICE_ROLE_KEY is required to create users through API"
      },
      { status: 500 }
    );
  }

  const { data: authCreated, error: authError } = await admin.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: {
      full_name: body.fullName
    }
  });

  if (authError || !authCreated.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Unable to create auth user" },
      { status: 400 }
    );
  }

  await admin.from("users").upsert({
    id: authCreated.user.id,
    organization_id: organizationId,
    email: body.email,
    full_name: body.fullName,
    status: body.status ?? "active",
    role_id: body.roleId ?? null,
    facility_id: body.facilityId ?? null
  } as any);

  if (body.roleId) {
    await admin.from("user_roles").upsert(
      {
        organization_id: organizationId,
        user_id: authCreated.user.id,
        role_id: body.roleId,
        facility_id: body.facilityId ?? null,
        status: body.status ?? "active"
      } as any,
      { onConflict: "user_id,role_id,organization_id" }
    );
  }

  await logActivity({
    supabase: admin,
    userId: user.id,
    organizationId,
    action: "users.create",
    resourceType: "user",
    resourceId: authCreated.user.id,
    metadata: { email: body.email }
  });

  return NextResponse.json({ id: authCreated.user.id, email: body.email }, { status: 201 });
}
