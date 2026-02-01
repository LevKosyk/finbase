"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

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
            include: { settings: true, subscription: true }
        });
        return dbUser;
    } catch (e) {
        console.error(e);
        return null;
    }
}
