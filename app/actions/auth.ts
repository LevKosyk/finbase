"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createAdminClient } from "@/utils/supabase/admin";
import { sendVerificationCode } from "@/app/actions/email";
import { cacheKey, getCacheJson, hashToken, setCacheJson, invalidateUserCache } from "@/lib/redis-cache";
import { Prisma } from "@prisma/client";

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

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Sync user on login just in case
  const syncResult = await syncUser();
  if (syncResult.user) {
    await logSession(syncResult.user.id);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}



export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  
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
  await supabase.auth.signOut();
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
            const tokenKey = cacheKey("auth", "session", hashToken(token));
            const expires = session.expires_in && session.expires_in > 60 ? session.expires_in : 60;
            await setCacheJson(tokenKey, { userId: user.id }, expires);
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
    const ip = headersList.get("x-forwarded-for") || "Unknown Icon"; // Basic check

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
        
        // Update last active of others? Or simpler: Just create new record. 
        // Real auth systems manage tokens. Here we just log "Login activity".
    } catch (e) {
        console.error("Failed to log session:", e);
    }
}
