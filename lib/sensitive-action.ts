"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit-log";
import { SENSITIVE_REAUTH_COOKIE, TWO_FACTOR_SESSION_COOKIE } from "@/lib/auth-cookies";

const REAUTH_TTL_SECONDS = 60 * 10;

function parseUnixSeconds(value?: string | null) {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

async function hasRecentReauth() {
  const cookieStore = await cookies();
  const value = parseUnixSeconds(cookieStore.get(SENSITIVE_REAUTH_COOKIE)?.value);
  if (!value) return false;
  return Date.now() - value * 1000 <= REAUTH_TTL_SECONDS * 1000;
}

async function detectSuspiciousActivity(userId: string) {
  let recent: Array<{ ip: string | null; browser: string | null; os: string | null }> = [];
  try {
    recent = await prisma.session.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 2) },
      },
      select: { ip: true, browser: true, os: true },
      take: 50,
    });
  } catch {
    return false;
  }
  const uniqueIps = new Set(recent.map((r) => r.ip).filter(Boolean));
  const uniqueBrowsers = new Set(recent.map((r) => `${r.browser || "?"}-${r.os || "?"}`));
  return uniqueIps.size >= 3 && uniqueBrowsers.size >= 2;
}

export async function markSensitiveActionReauth() {
  const cookieStore = await cookies();
  cookieStore.set(SENSITIVE_REAUTH_COOKIE, String(Math.floor(Date.now() / 1000)), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: REAUTH_TTL_SECONDS,
  });
}

export async function ensureSensitiveActionAccess(options?: {
  action?: string;
  requireRecentReauth?: boolean;
  requireTwoFactor?: boolean;
}) {
  const requireRecentReauth = options?.requireRecentReauth ?? true;
  const requireTwoFactor = options?.requireTwoFactor ?? true;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, error: "Unauthorized", code: "UNAUTHORIZED" as const };
  }

  const twoFactor = await prisma.twoFactorAuth.findUnique({
    where: { userId: user.id },
    select: { enabled: true },
  });
  const twoFactorEnabled = Boolean(twoFactor?.enabled);
  const cookieStore = await cookies();
  const twoFactorVerified = cookieStore.get(TWO_FACTOR_SESSION_COOKIE)?.value === "1";

  if (requireTwoFactor && !twoFactorEnabled) {
    return { ok: false as const, error: "Enable 2FA for this action", code: "TWO_FACTOR_REQUIRED" as const };
  }
  if (twoFactorEnabled && !twoFactorVerified) {
    return { ok: false as const, error: "2FA verification required", code: "TWO_FACTOR_NOT_VERIFIED" as const };
  }
  if (requireRecentReauth && !(await hasRecentReauth())) {
    return { ok: false as const, error: "Recent re-auth required", code: "REAUTH_REQUIRED" as const };
  }

  const suspicious = await detectSuspiciousActivity(user.id);
  if (suspicious) {
    cookieStore.delete(SENSITIVE_REAUTH_COOKIE);
    cookieStore.delete(TWO_FACTOR_SESSION_COOKIE);
    await logAuditEvent({
      userId: user.id,
      action: "security.sensitive_action.blocked_suspicious",
      entityType: "security",
      metadata: { action: options?.action || "unknown" },
    });
    return { ok: false as const, error: "Suspicious activity detected", code: "SUSPICIOUS_ACTIVITY" as const };
  }

  return { ok: true as const, userId: user.id };
}
