"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { invalidateUserCache } from "@/lib/redis-cache";
import { logAuditEvent } from "@/lib/audit-log";
import { ensureSensitiveActionAccess } from "@/lib/sensitive-action";

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
  taxRate?: number;
  fixedMonthlyTax?: number;
  esvMonthly?: number;
  incomeLimit?: number;
  reportingPeriod?: string;
  taxPaymentDay?: number;
  reportDay?: number;
  iban?: string;
  phone?: string;
  email?: string;
  registrationDate?: Date;
  taxOffice?: string;
  expenseCategories?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  try {
    const normalizedGroup = 3;
    const normalizedReportingPeriod =
      data.reportingPeriod === "monthly" || data.reportingPeriod === "quarterly"
        ? data.reportingPeriod
        : data.reportingPeriod
          ? "quarterly"
          : undefined;

    await prisma.fOPSettings.upsert({
      where: { userId: user.id },
      update: {
        ...data,
        group: normalizedGroup,
        ...(data.reportingPeriod !== undefined ? { reportingPeriod: normalizedReportingPeriod } : {}),
      },
      create: {
        userId: user.id,
        ...data,
        group: normalizedGroup,
        ...(data.reportingPeriod !== undefined ? { reportingPeriod: normalizedReportingPeriod } : {}),
      },
    });
    await invalidateUserCache(user.id);
    await logAuditEvent({
      userId: user.id,
      action: "settings.fop.update",
      entityType: "fop_settings",
      metadata: { fields: Object.keys(data) },
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
  weeklyGovReport?: boolean;
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
    await invalidateUserCache(user.id);
    await logAuditEvent({
      userId: user.id,
      action: "settings.notifications.update",
      entityType: "notification_settings",
      metadata: { ...data },
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
        const safeAvatarUrl =
          data.avatarUrl && !data.avatarUrl.startsWith("data:") && data.avatarUrl.length < 2000
            ? data.avatarUrl
            : undefined;
        if (data.email && data.email !== user.email) {
            const access = await ensureSensitiveActionAccess({
              action: "settings.profile.change_email",
              requireRecentReauth: true,
              requireTwoFactor: true,
            });
            if (!access.ok) {
              return { error: access.error };
            }
            const { error: updateAuthError } = await supabase.auth.updateUser({ email: data.email });
            if (updateAuthError) {
              return { error: updateAuthError.message };
            }
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                name: data.name,
                firstName: data.firstName,
                lastName: data.lastName,
                avatarUrl: safeAvatarUrl,
                ...(data.email ? { email: data.email } : {}),
            }
        });
        await invalidateUserCache(user.id);
        await logAuditEvent({
          userId: user.id,
          action: "settings.profile.update",
          entityType: "user_profile",
          metadata: { fields: ["name", "firstName", "lastName", "avatarUrl"] },
        });
        revalidatePath("/dashboard/settings");
        return { success: true };
    } catch {
        return { error: "Profile update failed" };
    }
}
