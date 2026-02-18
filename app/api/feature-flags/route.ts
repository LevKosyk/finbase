import { NextResponse } from "next/server";
import { getFeatureFlagsSnapshotWithMeta } from "@/lib/feature-flags";
import { requireUser } from "@/lib/rbac";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const snapshot = await getFeatureFlagsSnapshotWithMeta(auth.user.id);
  return NextResponse.json(snapshot);
}
