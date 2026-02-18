"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import type { CategorizationRuleInput } from "@/lib/types/rules";
import { cacheKey, invalidateUserCache, withRedisCache } from "@/lib/redis-cache";
import { ensureSensitiveActionAccess } from "@/lib/sensitive-action";

function isMissingTableError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

function normalizeText(value?: string | null) {
  return (value || "").toLowerCase().replace(/\s+/g, " ").trim();
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
  const access = await ensureSensitiveActionAccess({
    action: "rules.delete",
    requireRecentReauth: true,
    requireTwoFactor: true,
  });
  if (!access.ok) return { success: false, error: access.error };

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
  revalidatePath("/dashboard/settings/rules");
  await invalidateUserCache(user.id);
  return { success: true };
}

export async function testCategorizationRule(input: CategorizationRuleInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const [recentIncome, recentExpenses] = await Promise.all([
    prisma.income.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { date: "desc" },
      take: 50,
      select: { id: true, source: true, type: true, amount: true, date: true },
    }),
    prisma.expense.findMany({
      where: { userId: user.id, deletedAt: null },
      orderBy: { date: "desc" },
      take: 50,
      select: { id: true, category: true, description: true, amount: true, date: true },
    }),
  ]);

  const sampleRows = [
    ...recentIncome.map((row) => ({
      id: row.id,
      direction: "income" as const,
      counterparty: row.source,
      description: row.type,
      amount: row.amount,
      date: row.date,
    })),
    ...recentExpenses.map((row) => ({
      id: row.id,
      direction: "expense" as const,
      counterparty: row.category,
      description: row.description || "",
      amount: row.amount,
      date: row.date,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 100);

  const containsNeedle = normalizeText(input.containsText);
  const counterpartyNeedle = normalizeText(input.counterpartyContains);
  const directionFilter = input.direction || "expense";

  const matched = sampleRows.filter((row) => {
    if (directionFilter !== "auto" && directionFilter !== row.direction) return false;
    const combined = normalizeText(`${row.counterparty} ${row.description}`);
    const containsOk = containsNeedle ? combined.includes(containsNeedle) : true;
    const counterpartyOk = counterpartyNeedle ? normalizeText(row.counterparty).includes(counterpartyNeedle) : true;
    return containsOk && counterpartyOk;
  });

  return {
    success: true,
    totalSample: sampleRows.length,
    matchedCount: matched.length,
    matchedPreview: matched.slice(0, 10).map((row) => ({
      id: row.id,
      direction: row.direction,
      amount: row.amount,
      date: row.date,
      counterparty: row.counterparty,
      description: row.description,
      categoryAfterRule: input.category,
    })),
  };
}
