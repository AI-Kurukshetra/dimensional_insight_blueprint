import { NextResponse } from "next/server";
import { getOverviewData } from "@/lib/platform-data";

export async function GET(
  _: Request,
  { params }: { params: { organizationId: string } }
) {
  const overview = await getOverviewData(params.organizationId);
  return NextResponse.json(overview);
}
