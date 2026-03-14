import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";
import { getSupabaseAnonKey, getSupabaseUrl, hasSupabaseEnv } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();

  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient<Database>(
    url,
    key,
    {
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
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/org") ||
    pathname.startsWith("/admin");
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isAdminRoute = pathname.startsWith("/admin");
  let membership: { role?: string } | null = null;

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("message", "Please sign in to continue.");
    return NextResponse.redirect(url);
  }

  if (user && (isAuthRoute || isAdminRoute)) {
    const membershipResult = await (supabase as any)
      .from("organization_memberships")
      .select("role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    membership = membershipResult.data as { role?: string } | null;
  }

  // Prevent /login <-> /dashboard redirect loops for authenticated users
  // who do not have any organization membership yet.
  if (user && isAuthRoute) {
    if (!membership) {
      return response;
    }

    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.delete("message");
    return NextResponse.redirect(url);
  }

  if (user && isAdminRoute) {
    if (!membership || membership.role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.searchParams.set("message", "Admin role required.");
      return NextResponse.redirect(url);
    }
  }

  return response;
}
