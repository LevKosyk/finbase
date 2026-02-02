"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateFOPSettings(data: {
  legalName?: string;
  ipn?: string;
  group?: number;
  address?: string;
  city?: string;
  street?: string;
  houseNumber?: string;
  zipCode?: string;
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

export async function updateNotificationSettings(data: {
  emailNews: boolean;
  monthlyReport: boolean;
  reportChannel: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    await prisma.notificationSettings.upsert({
        where: { userId: user.id },
        update: { ...data },
        create: {
            userId: user.id,
            ...data
        }
    });
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (e) {
      console.error(e);
      return { error: "Failed to update notifications" };
  }
}

export async function updateProfile(data: {
    name?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
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
                name: data.name,
                firstName: data.firstName,
                lastName: data.lastName,
                avatarUrl: data.avatarUrl
            }
        });
        revalidatePath("/dashboard/settings");
        return { success: true };
    } catch (e) {
        return { error: "Profile update failed" };
    }
}
