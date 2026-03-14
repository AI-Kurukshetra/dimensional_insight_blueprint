import { NextResponse } from "next/server";
import { resolveTenantContext } from "@/lib/api";

export async function GET() {
  const context = await resolveTenantContext();
  if ("error" in context) {
    return context.error;
  }

  const { supabase, organizationId } = context;
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const context = await resolveTenantContext();
  if ("error" in context) {
    return context.error;
  }

  if (context.role !== "admin") {
    return NextResponse.json({ error: "Admin role required" }, { status: 403 });
  }

  const body = (await request.json()) as {
    name: string;
    slug: string;
    planTier?: "growth" | "professional" | "enterprise";
    payerFocus: string;
  };

  const { data, error } = await context.supabase
    .from("organizations")
    .insert({
      name: body.name,
      slug: body.slug,
      plan_tier: body.planTier ?? "growth",
      payer_focus: body.payerFocus,
      organization_id: null
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
