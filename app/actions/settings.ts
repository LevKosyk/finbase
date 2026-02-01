"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateFOPSettings(data: {
  legalName?: string;
  ipn?: string;
  group?: number;
  address?: string;
  kveds?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    await prisma.fOPSettings.upsert({
      where: { userId: user.id },
      update: {
        ...data,
      },
      create: {
        userId: user.id,
        ...data,
      },
    });

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error("Error updating settings:", error);
    return { error: "Failed to update settings" };
  }
}

export async function updateProfile(data: {
    name?: string;
    email?: string; // Changing email is complex (auth sync), skipping for now or just DB update
    phone?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) {
      return { error: "Not authenticated" };
    }

    try {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                name: data.name
            }
        });
        revalidatePath("/dashboard/settings");
        return { success: true };
    } catch (e) {
        return { error: "Profile update failed" };
    }
}
