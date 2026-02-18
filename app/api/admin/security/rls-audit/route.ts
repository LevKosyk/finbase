import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { runRlsAudit } from "@/lib/rls-audit";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const report = await runRlsAudit();
  return NextResponse.json(report);
}
