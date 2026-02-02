"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

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

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, message: "Check email to continue sign in process" };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function signInWithOAuth(provider: 'google' | 'facebook' | 'apple') {
    const supabase = await createClient();
    const origin = (await headers()).get("origin");
    
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
        // Update name if changed? Maybe keep DB as source of truth.
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
    return { success: true, user: dbUser };
  } catch (error) {
    console.error("Error syncing user:", error);
    return { error: "Failed to sync user" };
  }
}

export async function getUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if(!user) return null;

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { settings: true, subscription: true, notifications: true }
        });
        return dbUser;
    } catch (e) {
        console.error(e);
        return null;
    }
}
