import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { checkPermission } from "@/lib/checkPermission";
import { RBAC_PERMISSIONS } from "@/lib/rbac";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  const permission = await checkPermission(RBAC_PERMISSIONS.manageUsers);
  if ("error" in permission) {
    return permission.error;
  }

  const { data, error } = await permission.supabase
    .from("roles")
    .select("*")
    .eq("organization_id", permission.organizationId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logActivity({
    supabase: permission.supabase,
    userId: permission.user.id,
    organizationId: permission.organizationId,
    action: "roles.list",
    resourceType: "role",
    metadata: { count: data?.length ?? 0 }
  });

  return NextResponse.json(
    (data ?? []).map((role: any) => ({
      id: role.id,
      name: role.role_name ?? role.name ?? role.role_slug ?? role.slug,
      slug: role.role_slug ?? role.slug ?? toSlug(role.role_name ?? role.name ?? "role")
    }))
  );
}

export async function POST(request: Request) {
  const permission = await checkPermission(RBAC_PERMISSIONS.manageUsers);
  if ("error" in permission) {
    return permission.error;
  }

  const body = (await request.json()) as { name: string; slug?: string; description?: string };
  const roleSlug = body.slug ? toSlug(body.slug) : toSlug(body.name);

  let inserted = await permission.supabase
    .from("roles")
    .insert({
      organization_id: permission.organizationId,
      role_name: body.name,
      role_slug: roleSlug,
      description: body.description ?? null,
      is_system: false
    } as any)
    .select("*")
    .single();

  if (inserted.error) {
    inserted = await permission.supabase
      .from("roles")
      .insert({
        organization_id: permission.organizationId,
        name: body.name,
        slug: roleSlug,
        description: body.description ?? null,
        is_system: false
      } as any)
      .select("*")
      .single();
  }

  if (inserted.error) {
    return NextResponse.json({ error: inserted.error.message }, { status: 400 });
  }

  await logActivity({
    supabase: permission.supabase,
    userId: permission.user.id,
    organizationId: permission.organizationId,
    action: "roles.create",
    resourceType: "role",
    resourceId: inserted.data.id as string,
    metadata: { slug: roleSlug }
  });

  return NextResponse.json(inserted.data, { status: 201 });
}
