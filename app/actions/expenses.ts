"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import type { ExpenseData, ExpenseImportRow } from "@/lib/types/expenses";
import { cacheKey, invalidateUserCache, withRedisCache } from "@/lib/redis-cache";
import { logAuditEvent } from "@/lib/audit-log";
import { expenseDataSchema, expenseImportRowSchema } from "@/lib/validation";
import { measureAction } from "@/lib/performance";
import { ensureSensitiveActionAccess } from "@/lib/sensitive-action";
import { checkAndStoreIdempotency } from "@/lib/idempotency";
import { enforceRateLimit } from "@/lib/security";
import { headers } from "next/headers";
import { enforceUserFopGroup3 } from "@/lib/fop-group-guard";

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

export async function createExpense(data: ExpenseData, idempotencyKey?: string) {
  return measureAction("action.createExpense", async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");
  await enforceUserFopGroup3(user.id, "action.expense.create");
  const ip = ((await headers()).get("x-forwarded-for") || "unknown").split(",")[0]?.trim() || "unknown";
  const burst = await enforceRateLimit(`action:expense:create:burst:${user.id}:${ip}`, 20, 60);
  if (!burst.allowed) {
    return { success: false, error: "Too many requests" };
  }
  const idem = await checkAndStoreIdempotency({
    scope: "action.expense.create",
    userId: user.id,
    key: idempotencyKey,
  });
  if (!idem.ok && idem.duplicate) {
    return { success: false, error: "Duplicate request" };
  }

  try {
    const parsed = expenseDataSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid expense payload" };
    }
    const created = await prisma.expense.create({
      data: {
        userId: user.id,
        amount: parsed.data.amount,
        category: parsed.data.category,
        date: parsed.data.date,
        description: parsed.data.description
      }
    });
    revalidatePath("/dashboard/expenses");
    revalidateTag("dashboard-stats", "max");
    revalidateTag("health-dashboard", "max");
    await invalidateUserCache(user.id);
    await logAuditEvent({
      userId: user.id,
      action: "expense.create",
      entityType: "expense",
      entityId: created.id,
      metadata: { amount: created.amount, category: created.category },
    });
    return { success: true, expense: created };
  } catch (error) {
    console.error("Failed to create expense:", error);
    return { success: false, error: "Failed to create expense" };
  }
  });
}

export async function getExpenseCategories() {
  return measureAction("action.getExpenseCategories", async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return DEFAULT_EXPENSE_CATEGORIES;
  await enforceUserFopGroup3(user.id, "action.expense.categories");

  const key = cacheKey("user", user.id, "expense-categories");
  return withRedisCache(key, 600, async () => {
    const settings = await prisma.fOPSettings.findUnique({
      where: { userId: user.id },
      select: { expenseCategories: true }
    });
    return parseExpenseCategories(settings?.expenseCategories);
  });
  });
}

export async function updateExpense(id: string, data: Partial<ExpenseData>) {
  return measureAction("action.updateExpense", async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");
  await enforceUserFopGroup3(user.id, "action.expense.update");

  try {
    const parsed = expenseDataSchema.partial().safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Invalid expense payload" };
    }
    const updated = await prisma.expense.update({
      where: { id, userId: user.id },
      data: parsed.data
    });
    revalidatePath("/dashboard/expenses");
    revalidateTag("dashboard-stats", "max");
    revalidateTag("health-dashboard", "max");
    await invalidateUserCache(user.id);
    await logAuditEvent({
      userId: user.id,
      action: "expense.update",
      entityType: "expense",
      entityId: id,
      metadata: { fields: Object.keys(data) },
    });
    return { success: true, expense: updated };
  } catch (error) {
    console.error("Failed to update expense:", error);
    return { success: false, error: "Failed to update expense" };
  }
  });
}

export async function deleteExpense(id: string) {
  return measureAction("action.deleteExpense", async () => {
  const access = await ensureSensitiveActionAccess({ action: "deleteExpense", requireRecentReauth: true, requireTwoFactor: true });
  if (!access.ok) return { success: false, error: access.error };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");
  await enforceUserFopGroup3(user.id, "action.expense.delete");

  try {
    await prisma.expense.update({
      where: { id, userId: user.id },
      data: { deletedAt: new Date() },
    });
    revalidatePath("/dashboard/expenses");
    revalidateTag("dashboard-stats", "max");
    revalidateTag("health-dashboard", "max");
    await invalidateUserCache(user.id);
    await logAuditEvent({
      userId: user.id,
      action: "expense.delete",
      entityType: "expense",
      entityId: id,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete expense:", error);
    return { success: false, error: "Failed to delete expense" };
  }
  });
}

export async function restoreExpense(id: string) {
  return measureAction("action.restoreExpense", async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");
  await enforceUserFopGroup3(user.id, "action.expense.restore");

  try {
    await prisma.expense.update({
      where: { id, userId: user.id },
      data: { deletedAt: null },
    });
    revalidatePath("/dashboard/expenses");
    revalidateTag("dashboard-stats", "max");
    revalidateTag("health-dashboard", "max");
    await invalidateUserCache(user.id);
    await logAuditEvent({
      userId: user.id,
      action: "expense.restore",
      entityType: "expense",
      entityId: id,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to restore expense:", error);
    return { success: false, error: "Failed to restore expense" };
  }
  });
}

export async function getExpenses(searchParams?: {
  q?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: string;
  maxAmount?: string;
  includeDeleted?: boolean;
}) {
  return measureAction("action.getExpenses", async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];
  await enforceUserFopGroup3(user.id, "action.expense.list");

  try {
    const filters: Prisma.ExpenseWhereInput = {
      userId: user.id,
      deletedAt: searchParams?.includeDeleted ? undefined : null,
    };

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
  });
}

export async function getExpenseStats() {
  return measureAction("action.getExpenseStats", async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { total: 0, change: 0, average: 0, count: 0 };
  await enforceUserFopGroup3(user.id, "action.expense.stats");

  const redisKey = cacheKey("user", user.id, "expense-stats");
  return withRedisCache(redisKey, 120, async () => await unstable_cache(
    async () => {
      try {
        const expenses = await prisma.expense.findMany({
          where: { userId: user.id, deletedAt: null },
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
  }, { budgetMs: 900 });
}

export async function importExpenses(rows: ExpenseImportRow[], idempotencyKey?: string) {
  return measureAction("action.importExpenses", async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");
  await enforceUserFopGroup3(user.id, "action.expense.import");
  if (rows.length > 5000) {
    return { success: false, error: "Too many rows. Limit is 5000." };
  }
  const ip = ((await headers()).get("x-forwarded-for") || "unknown").split(",")[0]?.trim() || "unknown";
  const burst = await enforceRateLimit(`action:expense:import:burst:${user.id}:${ip}`, 10, 60);
  if (!burst.allowed) {
    return { success: false, error: "Too many import requests" };
  }
  const idem = await checkAndStoreIdempotency({
    scope: "action.expense.import",
    userId: user.id,
    key: idempotencyKey,
    ttlSeconds: 60 * 30,
  });
  if (!idem.ok && idem.duplicate) {
    return { success: false, error: "Duplicate import request" };
  }

  try {
    const categories = await getExpenseCategories();
    const defaultCategory = categories[0] || "Інше";

    const payload = rows
      .map((r) => expenseImportRowSchema.safeParse(r))
      .filter((result) => result.success)
      .map((result) => ({
        userId: user.id,
        amount: Number(result.data.amount),
        category: result.data.category || defaultCategory,
        date: new Date(result.data.date),
        description: result.data.description
      }));

    if (payload.length === 0) {
      return { success: false, error: "No valid rows" };
    }

    await prisma.expense.createMany({ data: payload });
    revalidatePath("/dashboard/expenses");
    revalidateTag("dashboard-stats", "max");
    revalidateTag("health-dashboard", "max");
    await invalidateUserCache(user.id);
    await logAuditEvent({
      userId: user.id,
      action: "expense.import",
      entityType: "expense",
      metadata: { count: payload.length },
    });
    return { success: true, count: payload.length };
  } catch (error) {
    console.error("Failed to import expenses:", error);
    return { success: false, error: "Failed to import expenses" };
  }
  });
}

export async function getDeletedExpenses() {
  return measureAction("action.getDeletedExpenses", async () => getExpenses({ includeDeleted: true }).then((items) =>
    items.filter((item) => Boolean(item.deletedAt)).slice(0, 20)
  ));
}
