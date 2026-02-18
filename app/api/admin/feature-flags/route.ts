import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const flags = await prisma.featureFlag.findMany({
    orderBy: { key: "asc" },
    select: {
      id: true,
      key: true,
      enabled: true,
      rolloutPercent: true,
      description: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ flags });
}

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json()) as {
    key?: string;
    enabled?: boolean;
    rolloutPercent?: number;
    description?: string;
  };

  const key = String(body.key || "").trim();
  if (!key) return NextResponse.json({ error: "Flag key is required" }, { status: 400 });

  const rolloutPercent = Math.max(0, Math.min(100, Math.round(Number(body.rolloutPercent ?? 100))));
  const enabled = Boolean(body.enabled);
  const description = body.description ? String(body.description).slice(0, 300) : null;

  const row = await prisma.featureFlag.upsert({
    where: { key },
    update: { enabled, rolloutPercent, description },
    create: { key, enabled, rolloutPercent, description },
    select: {
      id: true,
      key: true,
      enabled: true,
      rolloutPercent: true,
      description: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ success: true, flag: row });
}
