import { NextResponse } from "next/server";
import { ensureCurrentUserOrganization } from "@/lib/organization-assignment";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") ? next : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      return NextResponse.redirect(
        `${origin}/login?message=${encodeURIComponent(exchangeError.message)}`
      );
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    const organizationId = await ensureCurrentUserOrganization({
      supabase,
      user: user
        ? {
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata
          }
        : null
    });

    if (!organizationId) {
      return NextResponse.redirect(
        `${origin}/login?message=${encodeURIComponent(
          "Unable to automatically provision your organization. Please sign in again."
        )}`
      );
    }
  }

  return NextResponse.redirect(`${origin}${safeNext}`);
}
