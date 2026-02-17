"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const DEFAULT_LAYOUT = [
  "summary",
  "chart",
  "health",
  "tax",
  "premium",
  "ai",
];

export async function getDashboardPreference() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { layout: DEFAULT_LAYOUT, density: "comfortable" as const };

  const pref = await prisma.dashboardPreference.findUnique({
    where: { userId: user.id },
    select: { layoutJson: true, density: true },
  });

  const layout = Array.isArray(pref?.layoutJson) ? (pref?.layoutJson as string[]) : DEFAULT_LAYOUT;
  const density: "compact" | "comfortable" = pref?.density === "compact" ? "compact" : "comfortable";
  return { layout, density };
}

export async function saveDashboardPreference(input: { layout?: string[]; density?: "compact" | "comfortable" }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  await prisma.dashboardPreference.upsert({
    where: { userId: user.id },
    update: {
      layoutJson: input.layout ?? undefined,
      density: input.density ?? undefined,
    },
    create: {
      userId: user.id,
      layoutJson: input.layout ?? DEFAULT_LAYOUT,
      density: input.density ?? "comfortable",
    },
  });

  revalidatePath("/dashboard");
  return { success: true };
}
