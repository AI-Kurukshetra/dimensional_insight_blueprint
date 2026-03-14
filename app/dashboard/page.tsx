import { redirect } from "next/navigation";
import { getDefaultOrganizationSlug } from "@/lib/auth";

export default async function DashboardPage() {
  const slug = await getDefaultOrganizationSlug();
  redirect(`/org/${slug}/dashboard`);
}
