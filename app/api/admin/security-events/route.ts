import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const since = new Date(Date.now() - 1000 * 60 * 60 * 24);
  const events = await prisma.auditLog.findMany({
    where: {
      createdAt: { gte: since },
      OR: [
        { action: { startsWith: "security.alert." } },
        { action: "auth.login_failed" },
        { action: "auth.token_replay_detected" },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      action: true,
      entityType: true,
      metadata: true,
      createdAt: true,
      userId: true,
    },
  });

  const failedLogins = events.filter((e) => e.action === "auth.login_failed").length;
  const securityAlerts = events.filter((e) => e.action.startsWith("security.alert.")).length;
  const tokenReplay = events.filter((e) => e.action === "auth.token_replay_detected").length;

  return NextResponse.json({
    window: "24h",
    counters: {
      failedLogins,
      securityAlerts,
      tokenReplay,
    },
    events,
  });
}
