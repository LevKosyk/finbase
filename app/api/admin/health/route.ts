import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  return NextResponse.json({ ok: true, admin: true, email: auth.user.email });
}
