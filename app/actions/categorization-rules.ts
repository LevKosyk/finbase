"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { CategorizationRuleInput } from "@/lib/types/rules";
import { cacheKey, invalidateUserCache, withRedisCache } from "@/lib/redis-cache";

function isMissingTableError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

export async function getCategorizationRules() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    return await withRedisCache(cacheKey("user", user.id, "categorization-rules"), 90, async () => {
      return prisma.categorizationRule.findMany({
        where: { userId: user.id },
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      });
    });
  } catch (error) {
    if (isMissingTableError(error)) return [];
    throw error;
  }
}

export async function createCategorizationRule(input: CategorizationRuleInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  if (!input.category?.trim()) {
    return { success: false, error: "Category is required" };
  }
  if (!input.containsText?.trim() && !input.counterpartyContains?.trim()) {
    return { success: false, error: "Set containsText or counterpartyContains" };
  }

  try {
    await prisma.categorizationRule.create({
      data: {
        userId: user.id,
        direction: input.direction,
        category: input.category.trim(),
        containsText: input.containsText?.trim() || null,
        counterpartyContains: input.counterpartyContains?.trim() || null,
        priority: input.priority ?? 100,
        isActive: input.isActive ?? true,
      },
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return { success: false, error: "Categorization rules table is missing. Run Prisma sync." };
    }
    throw error;
  }

  revalidatePath("/dashboard/rules");
  await invalidateUserCache(user.id);
  return { success: true };
}

export async function updateCategorizationRule(id: string, input: Partial<CategorizationRuleInput>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    await prisma.categorizationRule.update({
      where: { id, userId: user.id },
      data: {
        direction: input.direction,
        category: input.category?.trim(),
        containsText: input.containsText !== undefined ? input.containsText.trim() || null : undefined,
        counterpartyContains: input.counterpartyContains !== undefined ? input.counterpartyContains.trim() || null : undefined,
        priority: input.priority,
        isActive: input.isActive,
      },
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return { success: false, error: "Categorization rules table is missing. Run Prisma sync." };
    }
    throw error;
  }

  revalidatePath("/dashboard/rules");
  await invalidateUserCache(user.id);
  return { success: true };
}

export async function deleteCategorizationRule(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    await prisma.categorizationRule.delete({
      where: { id, userId: user.id },
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return { success: false, error: "Categorization rules table is missing. Run Prisma sync." };
    }
    throw error;
  }

  revalidatePath("/dashboard/rules");
  await invalidateUserCache(user.id);
  return { success: true };
}
