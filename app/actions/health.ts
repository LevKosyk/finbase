"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { buildObligationsTimeline } from "@/lib/compliance";
import { cacheKey, withRedisCache } from "@/lib/redis-cache";
import { unstable_cache } from "next/cache";
import { measureAction } from "@/lib/performance";
import { enforceUserFopGroup3 } from "@/lib/fop-group-guard";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export async function getHealthDashboard() {
  return measureAction("action.getHealthDashboard", async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  await enforceUserFopGroup3(user.id, "action.health.dashboard");

  const redisKey = cacheKey("user", user.id, "health-dashboard");
  return withRedisCache(redisKey, 120, async () => await unstable_cache(async () => {
  const now = new Date();
  const startYear = new Date(now.getFullYear(), 0, 1);
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const prev1 = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prev2 = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const prev3 = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  const [settings, yearIncomeAgg, incomeBySource, expenseByMonth, incomeByMonth] = await Promise.all([
    prisma.fOPSettings.findUnique({ where: { userId: user.id } }),
    prisma.income.aggregate({
      where: { userId: user.id, deletedAt: null, date: { gte: startYear } },
      _sum: { amount: true },
    }),
    prisma.income.groupBy({
      by: ["source"],
      where: { userId: user.id, deletedAt: null, date: { gte: startYear } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
    prisma.$queryRaw<Array<{ month: Date; total: number }>>(Prisma.sql`
      SELECT date_trunc('month', "date") AS month, COALESCE(SUM("amount"), 0)::float AS total
      FROM "Expense"
      WHERE "userId" = ${user.id}
        AND "deletedAt" IS NULL
        AND "date" >= ${prev3}
      GROUP BY 1
      ORDER BY 1 ASC
    `),
    prisma.$queryRaw<Array<{ month: Date; total: number }>>(Prisma.sql`
      SELECT date_trunc('month', "date") AS month, COALESCE(SUM("amount"), 0)::float AS total
      FROM "Income"
      WHERE "userId" = ${user.id}
        AND "deletedAt" IS NULL
        AND "date" >= ${prev3}
      GROUP BY 1
      ORDER BY 1 ASC
    `),
  ]);
  if (!settings) return null;

  const yearIncome = yearIncomeAgg._sum.amount || 0;
  const limitUsage = settings.incomeLimit && settings.incomeLimit > 0 ? (yearIncome / settings.incomeLimit) * 100 : 0;

  const topSourceTotal = incomeBySource[0]?._sum.amount || 0;
  const topSourceShare = topSourceTotal > 0 && yearIncome > 0 ? (topSourceTotal / yearIncome) * 100 : 0;

  const monthTotals = new Map<string, number>();
  expenseByMonth.forEach((row) => {
    const d = new Date(row.month);
    monthTotals.set(`${d.getFullYear()}-${d.getMonth()}`, Number(row.total || 0));
  });
  const expenseMonth = monthTotals.get(`${startMonth.getFullYear()}-${startMonth.getMonth()}`) || 0;
  const groupedPrev = [prev1, prev2, prev3].map((m) => monthTotals.get(`${m.getFullYear()}-${m.getMonth()}`) || 0);
  const avgPrevExpense = groupedPrev.length > 0 ? groupedPrev.reduce((a, b) => a + b, 0) / groupedPrev.length : 0;
  const expenseSpikePercent = avgPrevExpense > 0 ? ((expenseMonth - avgPrevExpense) / avgPrevExpense) * 100 : 0;

  const incomeMonthTotals = new Map<string, number>();
  incomeByMonth.forEach((row) => {
    const d = new Date(row.month);
    incomeMonthTotals.set(`${d.getFullYear()}-${d.getMonth()}`, Number(row.total || 0));
  });
  const incomeCurrentMonth = incomeMonthTotals.get(`${startMonth.getFullYear()}-${startMonth.getMonth()}`) || 0;
  const prevIncomeSeries = [prev1, prev2, prev3].map((m) => incomeMonthTotals.get(`${m.getFullYear()}-${m.getMonth()}`) || 0);
  const avgPrevIncome = prevIncomeSeries.length > 0 ? prevIncomeSeries.reduce((a, b) => a + b, 0) / prevIncomeSeries.length : 0;
  const incomeMomentumPercent = avgPrevIncome > 0 ? ((incomeCurrentMonth - avgPrevIncome) / avgPrevIncome) * 100 : 0;
  const monthsLeft = Math.max(0, 11 - now.getMonth());
  const runRateBase = avgPrevIncome > 0 ? avgPrevIncome : incomeCurrentMonth;
  const forecastYearIncome = yearIncome + runRateBase * monthsLeft;
  const forecastLimitUsage =
    settings.incomeLimit && settings.incomeLimit > 0 ? (forecastYearIncome / settings.incomeLimit) * 100 : 0;

  const obligations = buildObligationsTimeline(settings, now, 2);
  const overdue = obligations.filter((o) => o.status === "overdue").length;
  const dueSoon = obligations.filter((o) => o.status === "due_soon").length;

  const limitPenalty = limitUsage > 100 ? 35 : limitUsage > 90 ? 25 : limitUsage > 80 ? 15 : 0;
  const overduePenalty = overdue * 15 + dueSoon * 5;
  const concentrationPenalty = topSourceShare > 70 ? 20 : topSourceShare > 55 ? 10 : 0;
  const expenseSpikePenalty = expenseSpikePercent > 40 ? 20 : expenseSpikePercent > 20 ? 10 : 0;

  const riskScore = clamp(limitPenalty + overduePenalty + concentrationPenalty + expenseSpikePenalty, 0, 100);

  const actionsToday: Array<{ title: string; href: string; priority: "high" | "medium" | "low" }> = [];
  if (dueSoon > 0 || overdue > 0) actionsToday.push({ title: "Закрити прострочені/термінові зобов'язання", href: "/dashboard/calendar", priority: "high" });
  if (limitUsage > 80 || forecastLimitUsage > 90) actionsToday.push({ title: "Перевірити ризик перевищення річного ліміту", href: "/dashboard/statistics", priority: "high" });
  if (expenseSpikePercent > 20) actionsToday.push({ title: "Переглянути різке зростання витрат", href: "/dashboard/expenses", priority: "medium" });
  if (topSourceShare > 55) actionsToday.push({ title: "Знизити залежність від одного джерела доходу", href: "/dashboard/income", priority: "medium" });
  if (!settings.taxRate && !settings.fixedMonthlyTax) actionsToday.push({ title: "Заповнити податкові параметри ФОП", href: "/dashboard/settings/business", priority: "high" });
  if (actionsToday.length === 0) actionsToday.push({ title: "Критичних дій немає. Оновіть доходи/витрати за день.", href: "/dashboard", priority: "low" });

  return {
    riskScore,
    forecast: {
      yearIncome: parseFloat(forecastYearIncome.toFixed(2)),
      limitUsage: parseFloat(forecastLimitUsage.toFixed(1)),
      monthsLeft,
      incomeMomentum: parseFloat(incomeMomentumPercent.toFixed(1)),
    },
    scoreBreakdown: [
      { key: "limit", label: "Ліміт доходу", points: limitPenalty, value: parseFloat(limitUsage.toFixed(1)), unit: "%" },
      { key: "overdue", label: "Прострочки і дедлайни", points: overduePenalty, value: overdue + dueSoon, unit: "шт" },
      { key: "concentration", label: "Концентрація доходу", points: concentrationPenalty, value: parseFloat(topSourceShare.toFixed(1)), unit: "%" },
      { key: "expenses", label: "Різкий ріст витрат", points: expenseSpikePenalty, value: parseFloat(expenseSpikePercent.toFixed(1)), unit: "%" },
    ],
    factors: {
      limitUsage: parseFloat(limitUsage.toFixed(1)),
      overdueCount: overdue,
      dueSoonCount: dueSoon,
      incomeConcentration: parseFloat(topSourceShare.toFixed(1)),
      expenseSpike: parseFloat(expenseSpikePercent.toFixed(1)),
    },
    actionsToday,
  };
  }, [`health-dashboard-${user.id}`], { tags: ["health-dashboard", `user-${user.id}`], revalidate: 3600 })());
  });
}
