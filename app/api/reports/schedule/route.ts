import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveTenantContext } from "@/lib/api";

const schema = z.object({
  title: z.string(),
  cron: z.string(),
  recipients: z.array(z.string().email())
});

export async function POST(request: Request) {
  const context = await resolveTenantContext();
  if ("error" in context) {
    return context.error;
  }

  const payload = schema.parse(await request.json());

  await context.supabase.from("reports").insert({
    organization_id: context.organizationId,
    name: payload.title,
    category: "scheduled",
    status: "active",
    schedule_cron: payload.cron,
    owner_user_id: context.user.id,
    parameters: { recipients: payload.recipients }
  } as any);

  return NextResponse.json({
    status: "scheduled",
    message: `Report "${payload.title}" scheduled on ${payload.cron} for ${payload.recipients.join(", ")}.`
  });
}
