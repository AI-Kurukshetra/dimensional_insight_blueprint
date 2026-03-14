import { NextResponse } from "next/server";
import { ensureUserOrganization } from "@/lib/auth/ensureUserOrganization";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

async function provisionOrganization() {
  const supabase = (await createClient()) as any;
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      organizationId: null,
      error: "Please sign in to continue."
    };
  }

  const organizationId = await ensureUserOrganization({
    supabase,
    user: {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata
    }
  }).catch(() => null);

  if (!organizationId) {
    return {
      organizationId: null,
      error: "Unable to assign organization. Please contact support."
    };
  }

  return {
    organizationId,
    error: null
  };
}

export async function GET(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const { organizationId, error } = await provisionOrganization();

  if (!organizationId) {
    return NextResponse.redirect(
      new URL(`/login?message=${encodeURIComponent(error ?? "Unable to assign organization.")}`, request.url)
    );
  }

  const searchParams = new URL(request.url).searchParams;
  if (searchParams.get("format") === "json") {
    return NextResponse.json({ organizationId });
  }

  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.headers.set("x-organization-id", organizationId);
  return response;
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ organizationId: "demo" });
  }

  const { organizationId, error } = await provisionOrganization();
  if (!organizationId) {
    return NextResponse.json({ organizationId: null, error }, { status: 400 });
  }

  return NextResponse.json({ organizationId });
}
