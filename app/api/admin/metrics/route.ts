import { NextResponse } from "next/server";
import { getBusinessMetrics } from "@/app/actions/admin-metrics";

export async function GET() {
  const data = await getBusinessMetrics();
  if (!data) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json(data);
}
