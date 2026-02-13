"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import type { ExpenseData, ExpenseImportRow } from "@/lib/types/expenses";
import { cacheKey, invalidateUserCache, withRedisCache } from "@/lib/redis-cache";

const DEFAULT_EXPENSE_CATEGORIES = [
  "Офіс",
  "Маркетинг",
  "Транспорт",
  "Комунальні",
  "Підписки",
  "Інше"
];

function parseExpenseCategories(raw?: string | null) {
  if (!raw) return DEFAULT_EXPENSE_CATEGORIES;
  const categories = raw
    .split(/[\n,]+/)
    .map((c) => c.trim())
    .filter(Boolean);
  return categories.length > 0 ? Array.from(new Set(categories)) : DEFAULT_EXPENSE_CATEGORIES;
}

export async function createExpense(data: ExpenseData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  try {
    await prisma.expense.create({
      data: {
        userId: user.id,
        amount: data.amount,
        category: data.category,
        date: data.date,
        description: data.description
      }
    });
    revalidatePath("/dashboard/expenses");
    revalidateTag("dashboard-stats", "max");
    await invalidateUserCache(user.id);
    return { success: true };
  } catch (error) {
    console.error("Failed to create expense:", error);
    return { success: false, error: "Failed to create expense" };
  }
}

export async function getExpenseCategories() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return DEFAULT_EXPENSE_CATEGORIES;

  const key = cacheKey("user", user.id, "expense-categories");
  return withRedisCache(key, 600, async () => {
    const settings = await prisma.fOPSettings.findUnique({
      where: { userId: user.id },
      select: { expenseCategories: true }
    });
    return parseExpenseCategories(settings?.expenseCategories);
  });
}

export async function updateExpense(id: string, data: Partial<ExpenseData>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  try {
    await prisma.expense.update({
      where: { id, userId: user.id },
      data
    });
    revalidatePath("/dashboard/expenses");
    await invalidateUserCache(user.id);
    return { success: true };
  } catch (error) {
    console.error("Failed to update expense:", error);
    return { success: false, error: "Failed to update expense" };
  }
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  try {
    await prisma.expense.delete({
      where: { id, userId: user.id }
    });
    revalidatePath("/dashboard/expenses");
    revalidateTag("dashboard-stats", "max");
    await invalidateUserCache(user.id);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete expense:", error);
    return { success: false, error: "Failed to delete expense" };
  }
}

export async function getExpenses(searchParams?: {
  q?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: string;
  maxAmount?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  try {
    const filters: Prisma.ExpenseWhereInput = { userId: user.id };

    if (searchParams?.q) {
      filters.OR = [
        { category: { contains: searchParams.q, mode: "insensitive" } },
        { description: { contains: searchParams.q, mode: "insensitive" } }
      ];
    }

    if (searchParams?.category && searchParams.category !== "all") {
      filters.category = searchParams.category;
    }

    if (searchParams?.startDate || searchParams?.endDate) {
      filters.date = {};
      if (searchParams.startDate) filters.date.gte = new Date(searchParams.startDate);
      if (searchParams.endDate) filters.date.lte = new Date(searchParams.endDate);
    }

    if (searchParams?.minAmount || searchParams?.maxAmount) {
      filters.amount = {};
      if (searchParams.minAmount) filters.amount.gte = parseFloat(searchParams.minAmount);
      if (searchParams.maxAmount) filters.amount.lte = parseFloat(searchParams.maxAmount);
    }

    const key = cacheKey("user", user.id, "expenses", JSON.stringify(searchParams || {}));
    return withRedisCache(key, 90, async () => {
      return prisma.expense.findMany({
        where: filters,
        orderBy: { date: "desc" },
        take: 100
      });
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }
}

export async function getExpenseStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { total: 0, change: 0, average: 0, count: 0 };

  const redisKey = cacheKey("user", user.id, "expense-stats");
  return withRedisCache(redisKey, 120, async () => await unstable_cache(
    async () => {
      try {
        const expenses = await prisma.expense.findMany({
          where: { userId: user.id },
          orderBy: { date: "asc" }
        });

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const thisMonth = expenses.filter(e => {
          const d = new Date(e.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonth = lastMonthDate.getMonth();
        const lastMonthYear = lastMonthDate.getFullYear();
        const lastMonthExpenses = expenses.filter(e => {
          const d = new Date(e.date);
          return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        });

        const total = thisMonth.reduce((acc, curr) => acc + curr.amount, 0);
        const lastMonthTotal = lastMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
        const change = lastMonthTotal === 0 ? (total > 0 ? 100 : 0) : ((total - lastMonthTotal) / lastMonthTotal) * 100;
        const average = thisMonth.length > 0 ? total / thisMonth.length : 0;

        return {
          total,
          change: parseFloat(change.toFixed(1)),
          average,
          count: thisMonth.length
        };
      } catch (e) {
        console.error("Error calculating expense stats:", e);
        return { total: 0, change: 0, average: 0, count: 0 };
      }
    },
    [`expense-stats-${user.id}`],
    { tags: ["dashboard-stats", `user-${user.id}`], revalidate: 3600 }
  )());
}

export async function importExpenses(rows: ExpenseImportRow[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  try {
    const categories = await getExpenseCategories();
    const defaultCategory = categories[0] || "Інше";

    const payload = rows
      .filter(r => r.amount && r.date)
      .map(r => ({
        userId: user.id,
        amount: Number(r.amount),
        category: r.category || defaultCategory,
        date: new Date(r.date),
        description: r.description
      }));

    if (payload.length === 0) {
      return { success: false, error: "No valid rows" };
    }

    await prisma.expense.createMany({ data: payload });
    revalidatePath("/dashboard/expenses");
    revalidateTag("dashboard-stats", "max");
    await invalidateUserCache(user.id);
    return { success: true, count: payload.length };
  } catch (error) {
    console.error("Failed to import expenses:", error);
    return { success: false, error: "Failed to import expenses" };
  }
}
