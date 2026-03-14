import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { ensureUserOrganization } from "@/lib/auth/ensureUserOrganization";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

type RouteAccessRule = {
  prefix: string;
  roles: string[];
};

const accessRules: RouteAccessRule[] = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/dashboard/admin", roles: ["admin"] },
  { prefix: "/dashboard/executive", roles: ["executive", "admin"] },
  { prefix: "/dashboard/financial", roles: ["executive", "admin"] },
  { prefix: "/dashboard/operational", roles: ["executive", "admin"] },
  {
    prefix: "/dashboard/clinical",
    roles: ["doctor", "physician", "analyst", "executive", "admin"]
  },
  {
    prefix: "/dashboard/physician",
    roles: ["doctor", "physician", "analyst", "executive", "admin"]
  },
  { prefix: "/dashboard/analyst", roles: ["analyst", "doctor", "executive", "admin"] }
];

function normalizeRole(role: string | null | undefined) {
  const normalized = (role ?? "").toLowerCase();
  if (normalized === "physician") {
    return "doctor";
  }

  return normalized || null;
}

function resolveRequiredRoles(pathname: string) {
  const matchedRule = accessRules.find((rule) => pathname.startsWith(rule.prefix));
  return matchedRule?.roles ?? null;
}

function isAuthRoute(pathname: string) {
  return pathname === "/login" || pathname === "/signup";
}

export async function middleware(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const protectedRoute = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  const authRoute = isAuthRoute(pathname);

  if (!user && protectedRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("message", "Please sign in to continue.");
    return NextResponse.redirect(loginUrl);
  }

  if (!user) {
    return response;
  }

  const organizationId = await ensureUserOrganization({
    supabase: supabase as any,
    user: {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata
    }
  }).catch(() => null);

  if (!organizationId && (protectedRoute || authRoute)) {
    const setupUrl = request.nextUrl.clone();
    setupUrl.pathname = "/api/setup-user";
    return NextResponse.redirect(setupUrl);
  }

  if (authRoute) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.searchParams.delete("message");
    return NextResponse.redirect(dashboardUrl);
  }

  const requiredRoles = resolveRequiredRoles(pathname);
  if (!requiredRoles) {
    return response;
  }

  let role: string | null = null;

  const organizationMemberResult = await (supabase as any)
    .from("organization_members")
    .select("role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  const organizationMember = organizationMemberResult.data as { role?: string } | null;

  if (organizationMember?.role) {
    role = organizationMember.role;
  }

  if (!role) {
    const legacyMembershipResult = await (supabase as any)
      .from("organization_memberships")
      .select("role")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    const legacyMembership = legacyMembershipResult.data as { role?: string } | null;

    if (legacyMembership?.role) {
      role = legacyMembership.role;
    }
  }

  if (!role) {
    const appUserResult = await (supabase as any)
      .from("users")
      .select("role_id")
      .eq("id", user.id)
      .limit(1)
      .maybeSingle();
    const appUser = appUserResult.data as { role_id?: string } | null;

    if (appUser?.role_id) {
      const roleRecordResult = await (supabase as any)
        .from("roles")
        .select("slug, role_slug, name, role_name")
        .eq("id", appUser.role_id)
        .limit(1)
        .maybeSingle();
      const roleRecord = roleRecordResult.data as
        | { slug?: string; role_slug?: string; name?: string; role_name?: string }
        | null;

      role =
        roleRecord?.slug ??
        roleRecord?.role_slug ??
        roleRecord?.name ??
        roleRecord?.role_name ??
        null;
    }
  }

  const normalizedRole = normalizeRole(role);
  const normalizedRequiredRoles = requiredRoles.map((requiredRole) =>
    normalizeRole(requiredRole)
  );

  if (!normalizedRole || !normalizedRequiredRoles.includes(normalizedRole)) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.searchParams.set("message", "Your role does not permit that action.");
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/signup"]
};
