"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { headers, cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { ActiveSessionItem } from "@/lib/types/security";
import { logAuditEvent } from "@/lib/audit-log";
import { SESSION_COOKIE, TWO_FACTOR_CHALLENGE_COOKIE, TWO_FACTOR_SESSION_COOKIE, TRUSTED_DEVICE_COOKIE, AUTH_TIME_COOKIE, DEVICE_BIND_COOKIE, SENSITIVE_REAUTH_COOKIE } from "@/lib/auth-cookies";
import { ensureSensitiveActionAccess } from "@/lib/sensitive-action";
import { hashString } from "@/lib/security";

function isMissingTableError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

function parseUserAgent(userAgent: string) {
  const ua = userAgent || "";

  let os = "Unknown OS";
  if (ua.includes("Mac OS")) os = "macOS";
  if (ua.includes("Windows")) os = "Windows";
  if (ua.includes("Linux")) os = "Linux";
  if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  if (ua.includes("Android")) os = "Android";

  let device = "Desktop";
  if (ua.includes("iPhone")) device = "iPhone";
  if (ua.includes("iPad")) device = "iPad";
  if (ua.includes("Android")) device = "Android";

  let browser = "Unknown Browser";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/")) browser = "Safari";

  return { os, device, browser };
}

async function ensureCurrentSession(userId: string) {
  const headerList = await headers();
  const cookieStore = await cookies();
  const userAgent = headerList.get("user-agent") || "";
  const rawIp = (headerList.get("x-forwarded-for") || "").split(",")[0]?.trim() || null;
  const ip = rawIp ? `h:${hashString(rawIp).slice(0, 20)}` : null;
  const { os, device, browser } = parseUserAgent(userAgent);
  const now = new Date();
  const existingId = cookieStore.get(SESSION_COOKIE)?.value;

  try {
    let current = null as { id: string } | null;

    if (existingId) {
      const matched = await prisma.session.findFirst({
        where: { id: existingId, userId },
        select: { id: true },
      });
      if (matched) {
        current = matched;
      }
    }

    if (!current) {
      current = await prisma.session.create({
        data: {
          userId,
          device,
          os,
          browser,
          ip,
          location: "Unknown",
          isCurrent: true,
          lastActive: now,
        },
        select: { id: true },
      });
    }

    await prisma.session.updateMany({
      where: { userId, NOT: { id: current.id } },
      data: { isCurrent: false },
    });

    await prisma.session.update({
      where: { id: current.id },
      data: {
        isCurrent: true,
        lastActive: now,
        device,
        os,
        browser,
        ip,
      },
    });

    cookieStore.set(SESSION_COOKIE, current.id, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return current.id;
  } catch (error) {
    if (isMissingTableError(error)) return null;
    throw error;
  }
}

export async function getActiveSessions(): Promise<ActiveSessionItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const currentId = await ensureCurrentSession(user.id);
  if (!currentId) return [];

  try {
    const rows = await prisma.session.findMany({
      where: { userId: user.id },
      orderBy: [{ isCurrent: "desc" }, { lastActive: "desc" }],
      take: 20,
      select: {
        id: true,
        device: true,
        os: true,
        browser: true,
        ip: true,
        location: true,
        isCurrent: true,
        lastActive: true,
        createdAt: true,
      },
    });

    return rows.map((row) => ({
      id: row.id,
      device: row.device || "Unknown device",
      os: row.os || "Unknown OS",
      browser: row.browser || "Unknown Browser",
      ip: row.ip,
      location: row.location,
      isCurrent: row.id === currentId || row.isCurrent,
      lastActive: row.lastActive.toISOString(),
      createdAt: row.createdAt.toISOString(),
    }));
  } catch (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
}

export async function terminateSession(sessionId: string) {
  const access = await ensureSensitiveActionAccess({ action: "terminateSession", requireRecentReauth: true, requireTwoFactor: true });
  if (!access.ok) return { success: false, error: access.error };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const cookieStore = await cookies();
  const currentId = cookieStore.get(SESSION_COOKIE)?.value;
  if (currentId && currentId === sessionId) {
    return { success: false, error: "Не можна завершити поточну сесію тут." };
  }

  try {
    await prisma.session.deleteMany({
      where: { id: sessionId, userId: user.id },
    });
    await logAuditEvent({
      userId: user.id,
      action: "security.session.terminated",
      entityType: "session",
      entityId: sessionId,
    });
    revalidatePath("/dashboard/settings/security");
    return { success: true };
  } catch (error) {
    if (isMissingTableError(error)) {
      return { success: false, error: "Sessions table is missing. Run Prisma sync." };
    }
    throw error;
  }
}

export async function terminateOtherSessions() {
  const access = await ensureSensitiveActionAccess({ action: "terminateOtherSessions", requireRecentReauth: true, requireTwoFactor: true });
  if (!access.ok) return { success: false, error: access.error };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const cookieStore = await cookies();
  const currentId = cookieStore.get(SESSION_COOKIE)?.value || null;

  try {
    if (currentId) {
      await prisma.session.deleteMany({
        where: { userId: user.id, NOT: { id: currentId } },
      });
      await prisma.session.updateMany({
        where: { userId: user.id, id: currentId },
        data: { isCurrent: true, lastActive: new Date() },
      });
    } else {
      await prisma.session.deleteMany({
        where: { userId: user.id },
      });
    }

    revalidatePath("/dashboard/settings/security");
    await logAuditEvent({
      userId: user.id,
      action: "security.sessions.terminated_others",
      entityType: "session",
    });
    return { success: true };
  } catch (error) {
    if (isMissingTableError(error)) {
      return { success: false, error: "Sessions table is missing. Run Prisma sync." };
    }
    throw error;
  }
}

export async function terminateAllSessions() {
  const access = await ensureSensitiveActionAccess({ action: "terminateAllSessions", requireRecentReauth: true, requireTwoFactor: true });
  if (!access.ok) return { success: false, error: access.error };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  await prisma.session.deleteMany({ where: { userId: user.id } });
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(TWO_FACTOR_SESSION_COOKIE);
  cookieStore.delete(TWO_FACTOR_CHALLENGE_COOKIE);
  cookieStore.delete(TRUSTED_DEVICE_COOKIE);
  cookieStore.delete(AUTH_TIME_COOKIE);
  cookieStore.delete(DEVICE_BIND_COOKIE);
  cookieStore.delete(SENSITIVE_REAUTH_COOKIE);
  await logAuditEvent({
    userId: user.id,
    action: "security.sessions.terminated_all",
    entityType: "session",
  });
  revalidatePath("/dashboard/settings/security");
  return { success: true };
}

export async function getSuspiciousActivityAlerts() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const recent = await prisma.session.findMany({
    where: {
      userId: user.id,
      createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const alerts: string[] = [];
  const uniqueIps = new Set(recent.map((r) => r.ip).filter(Boolean));
  if (uniqueIps.size >= 4) {
    alerts.push("За 7 днів зафіксовано багато різних IP-адрес.");
  }

  const now = Date.now();
  const veryRecent = recent.filter((r) => now - r.createdAt.getTime() < 1000 * 60 * 60 * 2);
  const recentCountries = new Set(veryRecent.map((r) => r.location).filter(Boolean));
  if (recentCountries.size >= 2) {
    alerts.push("Підозріла активність: входи з різних локацій за короткий час.");
  }

  return alerts;
}
