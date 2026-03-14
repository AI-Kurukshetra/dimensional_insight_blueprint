import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { checkPermission } from "@/lib/checkPermission";
import { RBAC_PERMISSIONS } from "@/lib/rbac";

function toKey(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

export async function GET() {
  const permission = await checkPermission(RBAC_PERMISSIONS.manageUsers);
  if ("error" in permission) {
    return permission.error;
  }

  const { data, error } = await permission.supabase
    .from("permissions")
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
    action: "permissions.list",
    resourceType: "permission",
    metadata: { count: data?.length ?? 0 }
  });

  return NextResponse.json(
    (data ?? []).map((item: any) => ({
      id: item.id,
      name:
        item.permission_name ??
        item.name ??
        item.permission_key ??
        toKey(item.name ?? item.permission_name ?? "permission"),
      key: item.permission_key ?? toKey(item.permission_name ?? item.name ?? "permission")
    }))
  );
}

export async function POST(request: Request) {
  const permission = await checkPermission(RBAC_PERMISSIONS.manageUsers);
  if ("error" in permission) {
    return permission.error;
  }

  const body = (await request.json()) as {
    name: string;
    key?: string;
    description?: string;
    category?: string;
  };
  const permissionKey = body.key ? toKey(body.key) : toKey(body.name);

  let inserted = await permission.supabase
    .from("permissions")
    .insert({
      organization_id: permission.organizationId,
      permission_key: permissionKey,
      permission_name: body.name,
      description: body.description ?? null,
      category: body.category ?? "custom"
    } as any)
    .select("*")
    .single();

  if (inserted.error) {
    inserted = await permission.supabase
      .from("permissions")
      .insert({
        organization_id: permission.organizationId,
        name: body.name,
        description: body.description ?? null
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
    action: "permissions.create",
    resourceType: "permission",
    resourceId: inserted.data.id as string,
    metadata: { key: permissionKey }
  });

  return NextResponse.json(inserted.data, { status: 201 });
}
