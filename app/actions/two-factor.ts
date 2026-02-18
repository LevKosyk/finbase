"use server";

import { generateSecret, verify } from "otplib";
import QRCode from "qrcode";
import { cookies, headers } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { decryptText, encryptText } from "@/lib/crypto";
import { cacheKey, getCacheJson, setCacheJson } from "@/lib/redis-cache";
import { logAuditEvent } from "@/lib/audit-log";
import { markSensitiveActionReauth } from "@/lib/sensitive-action";
import {
  TRUSTED_DEVICE_COOKIE,
  TWO_FACTOR_CHALLENGE_COOKIE,
  TWO_FACTOR_SESSION_COOKIE,
} from "@/lib/auth-cookies";
import { sendVerificationCode } from "@/app/actions/email";

const TWO_FACTOR_SESSION_TTL_SECONDS = 60 * 60 * 12;
const TRUSTED_DEVICE_TTL_SECONDS = 60 * 60 * 24 * 30;
const LOGIN_2FA_CHALLENGE_TTL_SECONDS = 60 * 10;

type LoginChallengePayload = {
  userId: string;
  method: "totp" | "email";
  codeHash?: string;
  email?: string;
  createdAt: number;
};

function getDeviceFingerprint(userAgent: string, ip: string | null, lang: string | null) {
  return createHash("sha256")
    .update([userAgent || "ua", ip || "ip", lang || "lang"].join("|"))
    .digest("hex");
}

async function getRequestContext() {
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent") || "";
  const rawIp = (headerStore.get("x-forwarded-for") || "").split(",")[0]?.trim() || null;
  const ip = rawIp ? createHash("sha256").update(rawIp).digest("hex").slice(0, 24) : null;
  const lang = headerStore.get("accept-language");
  return {
    userAgent,
    ip,
    lang,
    fingerprint: getDeviceFingerprint(userAgent, ip, lang),
    userAgentHash: createHash("sha256").update(userAgent).digest("hex"),
  };
}

export async function getTwoFactorStatus() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { enabled: false };

  const row = await prisma.twoFactorAuth.findUnique({
    where: { userId: user.id },
    select: { enabled: true },
  });
  return { enabled: Boolean(row?.enabled) };
}

export async function beginTwoFactorSetup() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const secret = generateSecret();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Finbase";
  const account = encodeURIComponent(user.email || user.id);
  const issuer = encodeURIComponent(appName);
  const otpauth = `otpauth://totp/${issuer}:${account}?secret=${secret}&issuer=${issuer}`;
  const qrDataUrl = await QRCode.toDataURL(otpauth);
  const encryptedSecret = encryptText(secret);

  await prisma.twoFactorAuth.upsert({
    where: { userId: user.id },
    update: { secretEnc: encryptedSecret, enabled: false },
    create: { userId: user.id, secretEnc: encryptedSecret, enabled: false },
  });

  await logAuditEvent({
    userId: user.id,
    action: "security.2fa.setup_started",
    entityType: "two_factor",
  });

  return { success: true, qrDataUrl };
}

export async function confirmTwoFactorSetup(code: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const row = await prisma.twoFactorAuth.findUnique({ where: { userId: user.id } });
  if (!row?.secretEnc) return { success: false, error: "2FA setup is not initialized." };

  const secret = decryptText(row.secretEnc);
  const valid = verify({ token: code, secret });
  if (!valid) return { success: false, error: "Invalid verification code." };

  await prisma.twoFactorAuth.update({
    where: { userId: user.id },
    data: { enabled: true },
  });

  const cookieStore = await cookies();
  cookieStore.set(TWO_FACTOR_SESSION_COOKIE, "1", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TWO_FACTOR_SESSION_TTL_SECONDS,
  });

  await logAuditEvent({
    userId: user.id,
    action: "security.2fa.enabled",
    entityType: "two_factor",
  });

  return { success: true };
}

export async function disableTwoFactor(code: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const row = await prisma.twoFactorAuth.findUnique({ where: { userId: user.id } });
  if (!row?.enabled || !row.secretEnc) return { success: false, error: "2FA is not enabled." };

  const secret = decryptText(row.secretEnc);
  const valid = verify({ token: code, secret });
  if (!valid) return { success: false, error: "Invalid verification code." };

  await prisma.twoFactorAuth.update({
    where: { userId: user.id },
    data: { enabled: false, secretEnc: null },
  });

  const cookieStore = await cookies();
  cookieStore.delete(TWO_FACTOR_SESSION_COOKIE);
  cookieStore.delete(TRUSTED_DEVICE_COOKIE);

  await logAuditEvent({
    userId: user.id,
    action: "security.2fa.disabled",
    entityType: "two_factor",
  });
  return { success: true };
}

export async function createLoginTwoFactorChallenge(userId: string) {
  const challenge = randomBytes(24).toString("hex");
  const key = cacheKey("2fa", "challenge", challenge);
  await setCacheJson<LoginChallengePayload>(
    key,
    { userId, method: "totp", createdAt: Date.now() },
    LOGIN_2FA_CHALLENGE_TTL_SECONDS
  );
  const cookieStore = await cookies();
  cookieStore.set(TWO_FACTOR_CHALLENGE_COOKIE, challenge, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: LOGIN_2FA_CHALLENGE_TTL_SECONDS,
  });
  cookieStore.delete(TWO_FACTOR_SESSION_COOKIE);
}

export async function createEmailLoginTwoFactorChallenge(userId: string, email: string) {
  const challenge = randomBytes(24).toString("hex");
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = createHash("sha256").update(code).digest("hex");

  await setCacheJson<LoginChallengePayload>(
    cacheKey("2fa", "challenge", challenge),
    { userId, method: "email", codeHash, email, createdAt: Date.now() },
    LOGIN_2FA_CHALLENGE_TTL_SECONDS
  );

  const cookieStore = await cookies();
  cookieStore.set(TWO_FACTOR_CHALLENGE_COOKIE, challenge, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: LOGIN_2FA_CHALLENGE_TTL_SECONDS,
  });
  cookieStore.delete(TWO_FACTOR_SESSION_COOKIE);

  const result = await sendVerificationCode(email, code);
  if (result?.error) {
    return { success: false, error: result.error };
  }
  return { success: true };
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!name || !domain) return email;
  if (name.length <= 2) return `${name[0] || "*"}*@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
}

export async function getLoginTwoFactorMethod() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { method: null as "totp" | "email" | null };

  const cookieStore = await cookies();
  const challenge = cookieStore.get(TWO_FACTOR_CHALLENGE_COOKIE)?.value;
  if (!challenge) return { method: null as "totp" | "email" | null };

  const challengeData = await getCacheJson<LoginChallengePayload>(cacheKey("2fa", "challenge", challenge));
  if (!challengeData || challengeData.userId !== user.id) {
    return { method: null as "totp" | "email" | null };
  }

  return {
    method: challengeData.method,
    emailMasked: challengeData.email ? maskEmail(challengeData.email) : undefined,
  };
}

export async function completeLoginTwoFactor(code: string, trustDevice = false) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const cookieStore = await cookies();
  const challenge = cookieStore.get(TWO_FACTOR_CHALLENGE_COOKIE)?.value;
  if (!challenge) return { success: false, error: "2FA challenge expired." };

  const challengeData = await getCacheJson<LoginChallengePayload>(cacheKey("2fa", "challenge", challenge));
  if (!challengeData || challengeData.userId !== user.id) {
    return { success: false, error: "Invalid 2FA challenge." };
  }

  if (challengeData.method === "totp") {
    const row = await prisma.twoFactorAuth.findUnique({ where: { userId: user.id } });
    if (!row?.enabled || !row.secretEnc) {
      return { success: false, error: "2FA is not enabled." };
    }
    const secret = decryptText(row.secretEnc);
    const valid = verify({ token: code, secret });
    if (!valid) return { success: false, error: "Invalid verification code." };
  } else {
    const codeHash = createHash("sha256").update(code.trim()).digest("hex");
    if (!challengeData.codeHash || challengeData.codeHash !== codeHash) {
      return { success: false, error: "Invalid email verification code." };
    }
    trustDevice = false;
  }

  cookieStore.set(TWO_FACTOR_SESSION_COOKIE, "1", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TWO_FACTOR_SESSION_TTL_SECONDS,
  });
  cookieStore.delete(TWO_FACTOR_CHALLENGE_COOKIE);

  if (trustDevice) {
    const ctx = await getRequestContext();
    const token = randomBytes(24).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await prisma.trustedDevice.create({
      data: {
        userId: user.id,
        deviceHash: tokenHash,
        fingerprintHash: ctx.fingerprint,
        lastIp: ctx.ip,
        userAgentHash: ctx.userAgentHash,
        label: ctx.userAgent.slice(0, 120),
        expiresAt: new Date(Date.now() + TRUSTED_DEVICE_TTL_SECONDS * 1000),
      },
    });
    cookieStore.set(TRUSTED_DEVICE_COOKIE, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: TRUSTED_DEVICE_TTL_SECONDS,
    });
  }

  await logAuditEvent({
    userId: user.id,
    action: challengeData.method === "totp" ? "security.2fa.login_verified" : "security.email_2fa.login_verified",
    entityType: "two_factor",
  });
  return { success: true };
}

export async function authorizeSensitiveActionWithTwoFactor(code: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const row = await prisma.twoFactorAuth.findUnique({ where: { userId: user.id } });
  if (!row?.enabled || !row.secretEnc) {
    return { success: false, error: "2FA is not enabled." };
  }
  const secret = decryptText(row.secretEnc);
  const valid = verify({ token: code, secret });
  if (!valid) return { success: false, error: "Invalid verification code." };

  await markSensitiveActionReauth();
  await logAuditEvent({
    userId: user.id,
    action: "security.sensitive_action.reauth",
    entityType: "two_factor",
  });
  return { success: true };
}

export async function isTrustedDeviceForUser(userId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(TRUSTED_DEVICE_COOKIE)?.value;
  if (!token) return false;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const ctx = await getRequestContext();

  const existing = await prisma.trustedDevice.findFirst({
    where: {
      userId,
      deviceHash: tokenHash,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  if (!existing) return false;
  if (existing.fingerprintHash && existing.fingerprintHash !== ctx.fingerprint) {
    return false;
  }
  if (existing.userAgentHash && existing.userAgentHash !== ctx.userAgentHash) {
    return false;
  }

  await prisma.trustedDevice.update({
    where: { id: existing.id },
    data: { lastUsedAt: new Date(), lastIp: ctx.ip },
  });
  return true;
}

export async function getTrustedDevices() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  return prisma.trustedDevice.findMany({
    where: { userId: user.id },
    orderBy: { lastUsedAt: "desc" },
    take: 20,
  });
}

export async function revokeTrustedDevice(deviceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  await prisma.trustedDevice.deleteMany({
    where: { id: deviceId, userId: user.id },
  });
  await logAuditEvent({
    userId: user.id,
    action: "security.trusted_device.revoked",
    entityType: "trusted_device",
    entityId: deviceId,
  });
  return { success: true };
}
