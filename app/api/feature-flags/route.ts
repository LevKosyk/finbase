import { NextResponse } from "next/server";
import { getFeatureFlagsSnapshot } from "@/lib/feature-flags";
import { requireUser } from "@/lib/rbac";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const flags = await getFeatureFlagsSnapshot();
  return NextResponse.json({ flags });
}
