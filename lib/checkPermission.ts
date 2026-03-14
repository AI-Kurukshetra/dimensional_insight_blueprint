import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserRole, type UserRoleContext } from "@/lib/getUserRole";
import {
  hasAnyPermission,
  hasPermission,
  normalizeRole,
  type PermissionName
} from "@/lib/rbac";

type AnySupabase = any;

export type PermissionContext = UserRoleContext & {
  supabase: AnySupabase;
  user: { id: string };
};

type PermissionResult = PermissionContext | { error: NextResponse };

function toPermissionKey(value?: string | null) {
  if (!value) {
    return "";
  }
  return value.toLowerCase().replace(/\s+/g, ".");
}

async function resolveRoleId(
  supabase: AnySupabase,
  organizationId: string,
  rawRole: string,
  normalizedRole: string
) {
  const candidates = Array.from(
    new Set([
      rawRole.toLowerCase(),
      normalizedRole,
      normalizedRole === "doctor" ? "physician" : normalizedRole
    ])
  );

  for (const candidate of candidates) {
    const bySlug = await supabase
      .from("roles")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("role_slug", candidate)
      .limit(1)
      .maybeSingle();
    if (bySlug.data?.id) {
      return bySlug.data.id as string;
    }
  }

  for (const candidate of candidates) {
    const bySlug = await supabase
      .from("roles")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("slug", candidate)
      .limit(1)
      .maybeSingle();
    if (bySlug.data?.id) {
      return bySlug.data.id as string;
    }
  }

  for (const candidate of candidates) {
    const byName = await supabase
      .from("roles")
      .select("id")
      .eq("organization_id", organizationId)
      .ilike("role_name", candidate)
      .limit(1)
      .maybeSingle();
    if (byName.data?.id) {
      return byName.data.id as string;
    }
  }

  for (const candidate of candidates) {
    const byName = await supabase
      .from("roles")
      .select("id")
      .eq("organization_id", organizationId)
      .ilike("name", candidate)
      .limit(1)
      .maybeSingle();
    if (byName.data?.id) {
      return byName.data.id as string;
    }
  }

  return null;
}

async function hasPermissionFromRolePermissions(
  supabase: AnySupabase,
  organizationId: string,
  rawRole: string,
  normalizedRole: string,
  permissionName: PermissionName
) {
  const roleId = await resolveRoleId(supabase, organizationId, rawRole, normalizedRole);
  if (!roleId) {
    return null;
  }

  const rolePermissions = await supabase
    .from("role_permissions")
    .select("permission_id")
    .eq("organization_id", organizationId)
    .eq("role_id", roleId);

  const permissionIds =
    rolePermissions.data
      ?.map((item: { permission_id?: string }) => item.permission_id)
      .filter(Boolean) ?? [];

  if (!permissionIds.length) {
    return false;
  }

  const byKey = await supabase
    .from("permissions")
    .select("id, permission_key, permission_name")
    .in("id", permissionIds as string[]);

  if (byKey.data?.length) {
    const granted = new Set(
      byKey.data.flatMap((permission: any) => [
        toPermissionKey(permission.permission_key),
        toPermissionKey(permission.permission_name)
      ])
    );
    return granted.has(permissionName);
  }

  const byName = await supabase.from("permissions").select("id, name").in("id", permissionIds);
  if (byName.data?.length) {
    const granted = new Set(byName.data.map((permission: any) => toPermissionKey(permission.name)));
    return granted.has(permissionName);
  }

  return null;
}

function forbidden(permissionName: string) {
  return NextResponse.json(
    { error: `Forbidden: missing permission '${permissionName}'` },
    { status: 403 }
  );
}

export async function checkPermission(permissionName: PermissionName): Promise<PermissionResult> {
  const supabase = (await createClient()) as AnySupabase;
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const roleContext = await getUserRole({ supabase, userId: user.id });
  if (!roleContext) {
    return { error: NextResponse.json({ error: "No role assignment found" }, { status: 403 }) };
  }

  const dbPermission = await hasPermissionFromRolePermissions(
    supabase,
    roleContext.organizationId,
    roleContext.rawRole,
    roleContext.role,
    permissionName
  );
  const allowed = dbPermission ?? hasPermission(roleContext.role, permissionName);

  if (!allowed) {
    return { error: forbidden(permissionName) };
  }

  return {
    ...roleContext,
    supabase,
    user: { id: user.id }
  };
}

export async function checkAnyPermission(
  permissionNames: PermissionName[]
): Promise<PermissionResult> {
  const supabase = (await createClient()) as AnySupabase;
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const roleContext = await getUserRole({ supabase, userId: user.id });
  if (!roleContext) {
    return { error: NextResponse.json({ error: "No role assignment found" }, { status: 403 }) };
  }

  let dbAllowed = false;
  let dbEvaluated = false;
  for (const permissionName of permissionNames) {
    const result = await hasPermissionFromRolePermissions(
      supabase,
      roleContext.organizationId,
      roleContext.rawRole,
      roleContext.role,
      permissionName
    );
    if (result !== null) {
      dbEvaluated = true;
      if (result) {
        dbAllowed = true;
        break;
      }
    }
  }

  const allowed =
    dbEvaluated && dbAllowed
      ? true
      : hasAnyPermission(roleContext.role, permissionNames);

  if (!allowed) {
    return { error: forbidden(permissionNames.join(", ")) };
  }

  return {
    ...roleContext,
    supabase,
    user: { id: user.id }
  };
}

export function requirePermissionResult(result: PermissionResult): PermissionContext {
  if ("error" in result) {
    throw new Error("Permission result contains error response.");
  }
  return result;
}

export function normalizeRoleForUI(role?: string | null) {
  return normalizeRole(role);
}
