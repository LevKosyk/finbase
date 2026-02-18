"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { createAdminClient } from "@/utils/supabase/admin";
import { sendVerificationCode } from "@/app/actions/email";
import { cacheKey, getCacheJson, hashToken, setCacheJson, invalidateUserCache } from "@/lib/redis-cache";
import { Prisma } from "@prisma/client";
import { logAuditEvent } from "@/lib/audit-log";
import { createEmailLoginTwoFactorChallenge, createLoginTwoFactorChallenge, isTrustedDeviceForUser } from "@/app/actions/two-factor";
import { buildDeviceFingerprint } from "@/lib/device-fingerprint";
import {
  AUTH_TIME_COOKIE,
  DEVICE_BIND_COOKIE,
  SENSITIVE_REAUTH_COOKIE,
  SESSION_COOKIE,
  TRUSTED_DEVICE_COOKIE,
  TWO_FACTOR_CHALLENGE_COOKIE,
  TWO_FACTOR_SESSION_COOKIE,
} from "@/lib/auth-cookies";
import { enforceRateLimit } from "@/lib/security";
import { hashString } from "@/lib/security";

function getSafeOrigin(unsafeOrigin: string | null) {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (!unsafeOrigin) return "http://localhost:3000";
  // Basic ASCII check, if it contains non-ascii, fallback to localhost or strip
  if (/[^\x00-\x7F]/.test(unsafeOrigin)) {
    console.warn("Detected non-ASCII origin, falling back to localhost:", unsafeOrigin);
    return "http://localhost:3000";
  }
  return unsafeOrigin;
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const headerStore = await headers();
  const ip = (headerStore.get("x-forwarded-for") || "unknown").split(",")[0]?.trim() || "unknown";
  const emailKey = (email || "").toLowerCase().trim();
  const rateDaily = await enforceRateLimit(`auth:login:daily:${ip}:${emailKey}`, 100, 60 * 60 * 24);
  if (!rateDaily.allowed) return { error: "Too many login attempts today." };
  const rateBurst = await enforceRateLimit(`auth:login:burst:${ip}:${emailKey}`, 8, 60);
  if (!rateBurst.allowed) return { error: "Too many login attempts. Try again in a minute." };

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const failBurst = await enforceRateLimit(`auth:failed:burst:${ip}:${emailKey}`, 50, 60 * 15);
    const knownUser = emailKey
      ? await prisma.user.findUnique({ where: { email: emailKey }, select: { id: true } })
      : null;
    if (knownUser?.id) {
      await logAuditEvent({
        userId: knownUser.id,
        action: "auth.login_failed",
        entityType: "session",
      });
      if ((failBurst.remaining ?? 0) <= 45) {
        await logAuditEvent({
          userId: knownUser.id,
          action: "security.alert.failed_login_spike",
          entityType: "security",
          metadata: { email: emailKey, ip },
        });
      }
    }
    return { error: error.message };
  }

  // Sync user on login just in case
  const syncResult = await syncUser();
  if (!syncResult.user) {
    return { error: "Failed to sync user profile" };
  }
  await logSession(syncResult.user.id);

  let twoFactor: { enabled: boolean } | null = null;
  try {
    twoFactor = await prisma.twoFactorAuth.findUnique({
      where: { userId: syncResult.user.id },
      select: { enabled: true },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021")) {
      throw error;
    }
  }
  if (twoFactor?.enabled) {
    const trusted = await isTrustedDeviceForUser(syncResult.user.id);
    if (!trusted) {
      await createLoginTwoFactorChallenge(syncResult.user.id);
      return { requires2fa: true };
    }
  } else {
    const emailChallenge = await createEmailLoginTwoFactorChallenge(syncResult.user.id, emailKey || syncResult.user.email || email);
    if (!emailChallenge.success) {
      return { error: "Не вдалося надіслати код підтвердження на email." };
    }
    return { requires2fa: true };
  }

  const cookieStore = await cookies();
  const userAgent = headerStore.get("user-agent") || "";
  const ipAddress = (headerStore.get("x-forwarded-for") || "").split(",")[0]?.trim() || null;
  const lang = headerStore.get("accept-language");

  cookieStore.set(TWO_FACTOR_SESSION_COOKIE, "1", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  cookieStore.set(AUTH_TIME_COOKIE, String(Math.floor(Date.now() / 1000)), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  cookieStore.set(DEVICE_BIND_COOKIE, buildDeviceFingerprint({ userAgent, ip: ipAddress, lang }), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  cookieStore.delete(SENSITIVE_REAUTH_COOKIE);

  revalidatePath("/", "layout");
  return { success: true };
}



export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string | null;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  if (confirmPassword !== null && password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }
  
  const headersList = await headers();
  const origin = getSafeOrigin(headersList.get("origin"));

  // 1. Create Admin Client
  let supabaseAdmin;
  try {
      supabaseAdmin = createAdminClient();
  } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      console.error("Admin Client Error:", message);
      return { error: "Server Configuration Error: " + message };
  }

  // 2. Generate Link/OTP manually (prevents default email)
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'signup',
    email,
    password,
    options: {
        redirectTo: `${origin}/api/auth/callback`,
        data: {
          full_name: `${firstName} ${lastName}`.trim(),
          name: `${firstName} ${lastName}`.trim(), // Legacy support if needed
          first_name: firstName,
          last_name: lastName
        }
    }
  });

  if (error) {
    console.error("Signup error (generateLink):", error);
    // Handle "User already registered" gracefully
    if (error.message.includes("already registered")) {
         return { error: "User already exists" };
    }
    return { error: error.message };
  }

  // 3. Extract the OTP code
  // generateLink returns properties like: action_link, email_otp, hashed_token, etc.
  // We need email_otp to send to the user.
  const otpCode = data.properties?.email_otp;
  
  if (!otpCode) {
      console.error("No OTP returned from generateLink");
      return { error: "Failed to generate verification code" };
  }

  // 4. Send Custom Email via Resend
  const emailResult = await sendVerificationCode(email, otpCode);

  if (emailResult.error) {
      console.error("Failed to send custom email:", emailResult.error);
      return { error: "Failed to send verification email: " + emailResult.error };
  }

  return { success: true, message: "Verification code sent to email" };
}

export async function verifyEmail(email: string, code: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: 'signup'
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    const syncResult = await syncUser();
    if (syncResult.user) {
        await logSession(syncResult.user.id);
    }
    return { success: true };
  }

  return { error: "Verification failed" };
}

export async function logout() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.auth.signOut();
  if (user?.id) {
    await logAuditEvent({
      userId: user.id,
      action: "auth.logout",
      entityType: "session",
    });
  }
  const cookieStore = await cookies();
  cookieStore.delete(TWO_FACTOR_SESSION_COOKIE);
  cookieStore.delete(TWO_FACTOR_CHALLENGE_COOKIE);
  cookieStore.delete(TRUSTED_DEVICE_COOKIE);
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(AUTH_TIME_COOKIE);
  cookieStore.delete(SENSITIVE_REAUTH_COOKIE);
  cookieStore.delete(DEVICE_BIND_COOKIE);
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function signInWithOAuth(provider: 'google' | 'facebook' | 'apple') {
    const supabase = await createClient();
    const headersList = await headers();
    const origin = getSafeOrigin(headersList.get("origin"));
    
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${origin}/api/auth/callback`,
        },
    });

    if (error) {
        return { error: error.message };
    }

    if (data.url) {
        redirect(data.url);
    }
}


export async function syncUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { error: "Not authenticated" };
  }

  try {
    const dbUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        avatarUrl: user.user_metadata.avatar_url,
      },
      create: {
        id: user.id, // Use Supabase ID as Prisma ID for consistency
        email: user.email,
        name: user.user_metadata.full_name || user.user_metadata.name || "User",
        firstName: user.user_metadata.full_name ? user.user_metadata.full_name.split(' ')[0] : (user.user_metadata.name ? user.user_metadata.name.split(' ')[0] : "User"),
        lastName: user.user_metadata.full_name ? user.user_metadata.full_name.split(' ').slice(1).join(' ') : (user.user_metadata.name ? user.user_metadata.name.split(' ').slice(1).join(' ') : ""),
        avatarUrl: user.user_metadata.avatar_url,
      },
    });
    await invalidateUserCache(dbUser.id);
    return { success: true, user: dbUser };
  } catch (error) {
    console.error("Error syncing user:", error);
    return { error: "Failed to sync user" };
  }
}

export async function getUser() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if(!user) return null;

    try {
        const token = session?.access_token;
        if (token) {
            const headerStore = await headers();
            const userAgent = headerStore.get("user-agent") || "";
            const ip = (headerStore.get("x-forwarded-for") || "").split(",")[0]?.trim() || null;
            const lang = headerStore.get("accept-language");
            const fingerprint = buildDeviceFingerprint({ userAgent, ip, lang });
            const tokenKey = cacheKey("auth", "session", hashToken(token));
            const existing = await getCacheJson<{ userId: string; fingerprint?: string }>(tokenKey);
            if (existing && existing.userId === user.id && existing.fingerprint && existing.fingerprint !== fingerprint) {
                await logAuditEvent({
                  userId: user.id,
                  action: "auth.token_replay_detected",
                  entityType: "session",
                });
                await supabase.auth.signOut();
                return null;
            }
            const expires = session.expires_in && session.expires_in > 60 ? session.expires_in : 60;
            await setCacheJson(tokenKey, { userId: user.id, fingerprint }, expires);
        }

        const includeRelations = {
            settings: true,
            subscription: true,
            notifications: true,
        } as const;
        type AppUser = Prisma.UserGetPayload<{ include: typeof includeRelations }> | null;

        const profileKey = cacheKey("user", user.id, "profile");
        const cachedUser = await getCacheJson<AppUser>(profileKey);
        if (cachedUser) {
            return cachedUser;
        }

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: includeRelations
        });
        
        // If user is in Supabase but not in DB (e.g. verified but sync failed initially), try syncing now
        if (!dbUser) {
            const syncResult = await syncUser();
            if (syncResult.user) {
                // Re-fetch with relations if needed, or just return basic user
                 const newDbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    include: includeRelations
                });
                if (newDbUser) {
                    await setCacheJson(profileKey, newDbUser, 180);
                }
                return newDbUser;
            }
        }

        if (dbUser) {
            await setCacheJson(profileKey, dbUser, 180);
        }
        return dbUser;
    } catch (e) {
        console.error(e);
        return null;
    }
}

async function logSession(userId: string) {
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") || "Unknown";
    const rawIp = headersList.get("x-forwarded-for") || "";
    const ip = rawIp ? `h:${hashString(rawIp).slice(0, 20)}` : "Unknown";

    // Simple parser for OS/Device (Mock-like for now, can be improved)
    let os = "Unknown OS";
    let device = "Desktop";
    if (userAgent.includes("Mac")) os = "macOS";
    if (userAgent.includes("Windows")) os = "Windows";
    if (userAgent.includes("iPhone")) { os = "iOS"; device = "iPhone"; }
    if (userAgent.includes("Android")) { os = "Android"; device = "Mobile"; }

    let browser = "Unknown Browser";
    if (userAgent.includes("Chrome")) browser = "Chrome";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
    if (userAgent.includes("Firefox")) browser = "Firefox";

    try {
        const knownIp = await prisma.session.findFirst({
          where: { userId, ip: ip || undefined },
          select: { id: true },
        });

        await prisma.session.create({
            data: {
                userId,
                device,
                os,
                browser,
                ip,
                location: "Unknown", // GeoIP would go here
                isCurrent: true
            }
        });
        await logAuditEvent({
          userId,
          action: "auth.login",
          entityType: "session",
          metadata: { device, os, browser },
          ip,
        });
        if (ip && !knownIp) {
          await logAuditEvent({
            userId,
            action: "security.suspicious.new_ip",
            entityType: "session",
            metadata: { ip, userAgent },
            ip,
          });
        }
        
        // Update last active of others? Or simpler: Just create new record. 
        // Real auth systems manage tokens. Here we just log "Login activity".
    } catch (e) {
        console.error("Failed to log session:", e);
    }
}
