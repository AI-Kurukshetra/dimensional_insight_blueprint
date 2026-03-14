import { NextResponse } from "next/server";
import { demoLabResults } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(demoLabResults);
  }

  const supabase = (await createClient()) as any;
  const { data, error } = await supabase.from("lab_results").select("*").limit(50);

  if (error) {
    return NextResponse.json(demoLabResults);
  }

  return NextResponse.json(
    data.map((item: any) => ({
      id: item.id,
      patientId: item.patient_id,
      testName: item.test_name,
      valueNumeric: item.value_numeric,
      abnormalFlag: item.abnormal_flag,
      collectedAt: item.collected_at
    }))
  );
}
