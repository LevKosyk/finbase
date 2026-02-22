"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import type { IncomeData, IncomeImportRow } from "@/lib/types/income";
import { Prisma } from "@prisma/client";
import { cacheKey, invalidateUserCache, withRedisCache } from "@/lib/redis-cache";
import { logAuditEvent } from "@/lib/audit-log";
import { incomeDataSchema, incomeImportRowSchema } from "@/lib/validation";
import { measureAction } from "@/lib/performance";
import { ensureSensitiveActionAccess } from "@/lib/sensitive-action";
import { checkAndStoreIdempotency } from "@/lib/idempotency";
import { enforceRateLimit } from "@/lib/security";
import { headers } from "next/headers";
import { enforceUserFopGroup3 } from "@/lib/fop-group-guard";

export async function createIncome(data: IncomeData, idempotencyKey?: string) {
    return measureAction("action.createIncome", async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }
    await enforceUserFopGroup3(user.id, "action.income.create");
    const ip = ((await headers()).get("x-forwarded-for") || "unknown").split(",")[0]?.trim() || "unknown";
    const burst = await enforceRateLimit(`action:income:create:burst:${user.id}:${ip}`, 20, 60);
    if (!burst.allowed) {
      return { success: false, error: "Too many requests" };
    }
    const idem = await checkAndStoreIdempotency({
      scope: "action.income.create",
      userId: user.id,
      key: idempotencyKey,
    });
    if (!idem.ok && idem.duplicate) {
      return { success: false, error: "Duplicate request" };
    }

    try {
        const parsed = incomeDataSchema.safeParse(data);
        if (!parsed.success) {
            return { success: false, error: "Invalid income payload" };
        }
        const created = await prisma.income.create({
            data: {
                userId: user.id,
                amount: parsed.data.amount,
                source: parsed.data.source,
                date: parsed.data.date,
                type: parsed.data.type,
                status: parsed.data.status || 'completed'
            }
        });
        revalidatePath('/dashboard/income');
        revalidateTag('dashboard-stats', "max");
        revalidateTag("health-dashboard", "max");
        await invalidateUserCache(user.id);
        await logAuditEvent({
          userId: user.id,
          action: "income.create",
          entityType: "income",
          entityId: created.id,
          metadata: { amount: created.amount, source: created.source, type: created.type },
        });
        return { success: true, income: created };
    } catch (error) {
        console.error("Failed to create income:", error);
        return { success: false, error: "Failed to create income" };
    }
    });
}

export async function importIncomes(rows: IncomeImportRow[], idempotencyKey?: string) {
    return measureAction("action.importIncomes", async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }
    await enforceUserFopGroup3(user.id, "action.income.import");
    if (rows.length > 5000) {
      return { success: false, error: "Too many rows. Limit is 5000." };
    }
    const ip = ((await headers()).get("x-forwarded-for") || "unknown").split(",")[0]?.trim() || "unknown";
    const burst = await enforceRateLimit(`action:income:import:burst:${user.id}:${ip}`, 10, 60);
    if (!burst.allowed) {
      return { success: false, error: "Too many import requests" };
    }
    const idem = await checkAndStoreIdempotency({
      scope: "action.income.import",
      userId: user.id,
      key: idempotencyKey,
      ttlSeconds: 60 * 30,
    });
    if (!idem.ok && idem.duplicate) {
      return { success: false, error: "Duplicate import request" };
    }

    try {
        const payload = rows
            .map((r) => incomeImportRowSchema.safeParse(r))
            .filter((result) => result.success)
            .map((result) => ({
                userId: user.id,
                amount: Number(result.data.amount),
                source: result.data.source,
                date: new Date(result.data.date),
                type: result.data.type,
                status: result.data.status || "completed"
            }));

        if (payload.length === 0) {
            return { success: false, error: "No valid rows" };
        }

        await prisma.income.createMany({ data: payload });
        revalidatePath('/dashboard/income');
        revalidateTag('dashboard-stats', "max");
        revalidateTag("health-dashboard", "max");
        await invalidateUserCache(user.id);
        await logAuditEvent({
          userId: user.id,
          action: "income.import",
          entityType: "income",
          metadata: { count: payload.length },
        });
        return { success: true, count: payload.length };
    } catch (error) {
        console.error("Failed to import incomes:", error);
        return { success: false, error: "Failed to import incomes" };
    }
    });
}

export async function updateIncome(id: string, data: Partial<IncomeData>) {
    return measureAction("action.updateIncome", async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");
    await enforceUserFopGroup3(user.id, "action.income.update");

    try {
        const parsed = incomeDataSchema.partial().safeParse(data);
        if (!parsed.success) {
            return { success: false, error: "Invalid income payload" };
        }
        const updated = await prisma.income.update({
            where: { id, userId: user.id },
            data: parsed.data,
        });
        revalidatePath('/dashboard/income');
        revalidateTag('dashboard-stats', "max");
        revalidateTag("health-dashboard", "max");
        await invalidateUserCache(user.id);
        await logAuditEvent({
          userId: user.id,
          action: "income.update",
          entityType: "income",
          entityId: id,
          metadata: { fields: Object.keys(data) },
        });
        return { success: true, income: updated };
    } catch (error) {
        console.error("Failed to update income:", error);
        return { success: false, error: "Failed to update income" };
    }
    });
}

export async function deleteIncome(id: string) {
    return measureAction("action.deleteIncome", async () => {
    const access = await ensureSensitiveActionAccess({ action: "deleteIncome", requireRecentReauth: true, requireTwoFactor: true });
    if (!access.ok) return { success: false, error: access.error };
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");
    await enforceUserFopGroup3(user.id, "action.income.delete");

    try {
        await prisma.income.update({
            where: { id, userId: user.id },
            data: { deletedAt: new Date() },
        });
        revalidatePath('/dashboard/income');
        revalidateTag('dashboard-stats', "max");
        revalidateTag("health-dashboard", "max");
        await invalidateUserCache(user.id);
        await logAuditEvent({
          userId: user.id,
          action: "income.delete",
          entityType: "income",
          entityId: id,
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to delete income:", error);
        return { success: false, error: "Failed to delete income" };
    }
    });
}

export async function restoreIncome(id: string) {
    return measureAction("action.restoreIncome", async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");
    await enforceUserFopGroup3(user.id, "action.income.restore");

    try {
        await prisma.income.update({
            where: { id, userId: user.id },
            data: { deletedAt: null },
        });
        revalidatePath('/dashboard/income');
        revalidateTag('dashboard-stats', "max");
        revalidateTag("health-dashboard", "max");
        await invalidateUserCache(user.id);
        await logAuditEvent({
          userId: user.id,
          action: "income.restore",
          entityType: "income",
          entityId: id,
        });
        return { success: true };
    } catch (error) {
        console.error("Failed to restore income:", error);
        return { success: false, error: "Failed to restore income" };
    }
    });
}

export async function getIncomes(searchParams?: { 
    q?: string; 
    period?: string; 
    source?: string; 
    type?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: string;
    maxAmount?: string;
    includeDeleted?: boolean;
}) {
  return measureAction("action.getIncomes", async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];
  await enforceUserFopGroup3(user.id, "action.income.list");

  try {
    const filters: Prisma.IncomeWhereInput = {
      userId: user.id,
      deletedAt: searchParams?.includeDeleted ? undefined : null,
    };

    if (searchParams?.q) {
        filters.OR = [
            { source: { contains: searchParams.q, mode: 'insensitive' } },
            { type: { contains: searchParams.q, mode: 'insensitive' } }
        ];
    }
    
    // Explicit filters
    if (searchParams?.source && searchParams.source !== 'all') {
        filters.source = searchParams.source;
    }

    if (searchParams?.type && searchParams.type !== 'all') {
        filters.type = searchParams.type;
    }

    // Date Range
    if (searchParams?.startDate || searchParams?.endDate) {
        filters.date = {};
        if (searchParams.startDate) {
            filters.date.gte = new Date(searchParams.startDate);
        }
        if (searchParams.endDate) {
            filters.date.lte = new Date(searchParams.endDate);
        }
    }

    // Amount Range
    if (searchParams?.minAmount || searchParams?.maxAmount) {
        filters.amount = {};
        if (searchParams.minAmount) {
            filters.amount.gte = parseFloat(searchParams.minAmount);
        }
        if (searchParams.maxAmount) {
            filters.amount.lte = parseFloat(searchParams.maxAmount);
        }
    }

    const key = cacheKey("user", user.id, "incomes", JSON.stringify(searchParams || {}));
    return withRedisCache(key, 90, async () => {
      const incomes = await prisma.income.findMany({
        where: filters,
        orderBy: { date: 'desc' },
        take: 100
      });
      return incomes;
    });
  } catch (error) {
    console.error("Error fetching incomes:", error);
    return [];
  }
  });
}

export async function getIncomeStats() {
    return measureAction("action.getIncomeStats", async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) return { total: 0, change: 0, average: 0, pending: 0, chartData: [] };
    await enforceUserFopGroup3(user.id, "action.income.stats");

    const redisKey = cacheKey("user", user.id, "income-stats");
    return withRedisCache(redisKey, 120, async () => await unstable_cache(
        async () => {
             try {
                const incomes = await prisma.income.findMany({
                    where: { userId: user.id, deletedAt: null },
                    orderBy: { date: 'asc' }
                });
                
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();
                
                const thisMonthIncomes = incomes.filter(i => {
                    const d = new Date(i.date);
                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                });

                const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const lastMonth = lastMonthDate.getMonth();
                const lastMonthYear = lastMonthDate.getFullYear();

                const lastMonthIncomes = incomes.filter(i => {
                    const d = new Date(i.date);
                    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
                });

                const total = thisMonthIncomes.reduce((acc, curr) => acc + curr.amount, 0);
                const lastMonthTotal = lastMonthIncomes.reduce((acc, curr) => acc + curr.amount, 0);
                
                let change = 0;
                if (lastMonthTotal === 0) {
                    change = total > 0 ? 100 : 0;
                } else {
                    change = ((total - lastMonthTotal) / lastMonthTotal) * 100;
                }

                const average = thisMonthIncomes.length > 0 ? total / thisMonthIncomes.length : 0;
                
                const pending = thisMonthIncomes
                    .filter(i => i.status === 'pending')
                    .reduce((acc, curr) => acc + curr.amount, 0);

                const monthMap = new Map<string, number>();
                const months = ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"];
                
                const currentYearIncomes = incomes.filter(i => new Date(i.date).getFullYear() === currentYear);
                
                currentYearIncomes.forEach(inc => {
                    const m = months[new Date(inc.date).getMonth()];
                    monthMap.set(m, (monthMap.get(m) || 0) + inc.amount);
                });
                
                const chartData = months.map(m => ({ name: m, income: monthMap.get(m) || 0 }));

                return {
                    total,
                    change: parseFloat(change.toFixed(1)),
                    average,
                    pending,
                    chartData
                };
            } catch (e) {
                console.error("Error calculating stats:", e);
                return { total: 0, change: 0, average: 0, pending: 0, chartData: [] };
            }
        },
        [`income-stats-${user.id}`],
        { tags: ['dashboard-stats', `user-${user.id}`], revalidate: 3600 }
    )());
  
    }, { budgetMs: 900 });
}

export async function getDeletedIncomes() {
  return measureAction("action.getDeletedIncomes", async () => getIncomes({ includeDeleted: true }).then((items) =>
    items.filter((item) => Boolean(item.deletedAt)).slice(0, 20)
  ));
}
