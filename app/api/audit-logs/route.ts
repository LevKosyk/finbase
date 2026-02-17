import { NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/audit-log";
import { requireUser } from "@/lib/rbac";
import { auditLogsQuerySchema } from "@/lib/validation";

export async function GET(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const parsed = auditLogsQuerySchema.safeParse({ limit: url.searchParams.get("limit") || "50" });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const limit = parsed.data.limit;
  const logs = await getAuditLogs(limit);
  return NextResponse.json({ logs });
}
