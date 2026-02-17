import { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

type AuditPayload = {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string;
};

function isMissingTableError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

async function resolveIp() {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    if (!forwarded) return null;
    return forwarded.split(",")[0]?.trim() || null;
  } catch {
    return null;
  }
}

async function resolveUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function logAuditEvent(payload: AuditPayload) {
  try {
    const userId = payload.userId || (await resolveUserId());
    if (!userId) return;

    await prisma.auditLog.create({
      data: {
        userId,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId,
        metadata: payload.metadata,
        ip: payload.ip || (await resolveIp()) || undefined,
      },
    });
  } catch (error) {
    if (isMissingTableError(error)) return;
    console.error("Failed to write audit log:", error);
  }
}

export async function getAuditLogs(limit = 50) {
  try {
    const userId = await resolveUserId();
    if (!userId) return [];
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: Math.min(200, Math.max(1, limit)),
    });
  } catch (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
}
