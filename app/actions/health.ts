"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { buildObligationsTimeline } from "@/lib/compliance";
import { cacheKey, withRedisCache } from "@/lib/redis-cache";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export async function getHealthDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const redisKey = cacheKey("user", user.id, "health-dashboard");
  return withRedisCache(redisKey, 120, async () => {
  const now = new Date();
  const startYear = new Date(now.getFullYear(), 0, 1);
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const prev1 = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prev2 = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const prev3 = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  const [settings, incomes, expenses] = await Promise.all([
    prisma.fOPSettings.findUnique({ where: { userId: user.id } }),
    prisma.income.findMany({ where: { userId: user.id, date: { gte: startYear } } }),
    prisma.expense.findMany({ where: { userId: user.id, date: { gte: prev3 } } }),
  ]);
  if (!settings) return null;

  const yearIncome = incomes.reduce((acc, i) => acc + i.amount, 0);
  const limitUsage = settings.incomeLimit && settings.incomeLimit > 0 ? (yearIncome / settings.incomeLimit) * 100 : 0;

  const sourceTotals = new Map<string, number>();
  incomes.forEach((i) => sourceTotals.set(i.source, (sourceTotals.get(i.source) || 0) + i.amount));
  const topSource = Array.from(sourceTotals.entries()).sort((a, b) => b[1] - a[1])[0];
  const topSourceShare = topSource && yearIncome > 0 ? (topSource[1] / yearIncome) * 100 : 0;

  const expenseMonth = expenses
    .filter((e) => new Date(e.date) >= startMonth)
    .reduce((acc, e) => acc + e.amount, 0);
  const prevExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d >= prev3 && d < startMonth;
  });
  const groupedPrev = [prev1, prev2, prev3].map((m) => {
    const y = m.getFullYear();
    const mo = m.getMonth();
    return prevExpenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === y && d.getMonth() === mo;
      })
      .reduce((acc, e) => acc + e.amount, 0);
  });
  const avgPrevExpense = groupedPrev.length > 0 ? groupedPrev.reduce((a, b) => a + b, 0) / groupedPrev.length : 0;
  const expenseSpikePercent = avgPrevExpense > 0 ? ((expenseMonth - avgPrevExpense) / avgPrevExpense) * 100 : 0;

  const obligations = buildObligationsTimeline(settings, now, 2);
  const overdue = obligations.filter((o) => o.status === "overdue").length;
  const dueSoon = obligations.filter((o) => o.status === "due_soon").length;

  const limitPenalty = limitUsage > 100 ? 35 : limitUsage > 90 ? 25 : limitUsage > 80 ? 15 : 0;
  const overduePenalty = overdue * 15 + dueSoon * 5;
  const concentrationPenalty = topSourceShare > 70 ? 20 : topSourceShare > 55 ? 10 : 0;
  const expenseSpikePenalty = expenseSpikePercent > 40 ? 20 : expenseSpikePercent > 20 ? 10 : 0;

  const riskScore = clamp(limitPenalty + overduePenalty + concentrationPenalty + expenseSpikePenalty, 0, 100);

  const actionsToday: string[] = [];
  if (dueSoon > 0 || overdue > 0) actionsToday.push("Перевірити календар і закрити прострочені/термінові зобов'язання.");
  if (limitUsage > 80) actionsToday.push("Контролювати ліміт доходу: підготувати план на випадок перевищення.");
  if (expenseSpikePercent > 20) actionsToday.push("Перевірити різке зростання витрат і узгодити оптимізацію.");
  if (topSourceShare > 55) actionsToday.push("Зменшити залежність від одного джерела доходу.");
  if (!settings.taxRate && !settings.fixedMonthlyTax) actionsToday.push("Заповнити податкові параметри у налаштуваннях ФОП.");
  if (actionsToday.length === 0) actionsToday.push("Критичних дій на сьогодні немає. Оновіть доходи/витрати за день.");

  return {
    riskScore,
    factors: {
      limitUsage: parseFloat(limitUsage.toFixed(1)),
      overdueCount: overdue,
      dueSoonCount: dueSoon,
      incomeConcentration: parseFloat(topSourceShare.toFixed(1)),
      expenseSpike: parseFloat(expenseSpikePercent.toFixed(1)),
    },
    actionsToday,
  };
  });
}
