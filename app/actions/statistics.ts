"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import type { StatisticsData } from "@/lib/types/statistics";

import { unstable_cache } from "next/cache";
import { cacheKey, withRedisCache } from "@/lib/redis-cache";
import { measureAction } from "@/lib/performance";

export async function getStatistics(
    period: 'month' | 'quarter' | 'year' | 'custom' = 'year',
    from?: string,
    to?: string
): Promise<StatisticsData | null> {
    return measureAction("action.getStatistics", async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const redisKey = cacheKey("user", user.id, "statistics", period, from || "na", to || "na");
    return withRedisCache(redisKey, 120, async () => await unstable_cache(
        async () => {
             try {
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: {
                      settings: {
                        select: {
                          taxRate: true,
                          fixedMonthlyTax: true,
                          esvMonthly: true,
                          incomeLimit: true,
                        },
                      },
                    },
                });

                const taxRate = dbUser?.settings?.taxRate || 0;
                const fixedMonthlyTax = dbUser?.settings?.fixedMonthlyTax || 0;
                const esvMonthly = dbUser?.settings?.esvMonthly || 0;
                const incomeLimit = dbUser?.settings?.incomeLimit || 0;

                // Date Range Logic
                const now = new Date();
                let startDate = new Date();
                let endDate = new Date();
                let previousStartDate = new Date();
                let previousEndDate = new Date();
                let periodMonths = 1;
                
                // Helper to reset time
                const resetTime = (d: Date) => d.setHours(0,0,0,0);
                
                if (period === 'month') {
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                    previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                    previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
                    periodMonths = 1;
                } else if (period === 'quarter') {
                     const quarter = Math.floor(now.getMonth() / 3);
                     const startMonth = quarter * 3;
                     startDate = new Date(now.getFullYear(), startMonth, 1);
                     endDate = new Date(now.getFullYear(), startMonth + 3, 0, 23, 59, 59, 999);
                     previousStartDate = new Date(now.getFullYear(), startMonth - 3, 1);
                     previousEndDate = new Date(now.getFullYear(), startMonth, 0, 23, 59, 59, 999);
                     periodMonths = 3;
                } else if (period === 'year') {
                     startDate = new Date(now.getFullYear(), 0, 1);
                     endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
                     previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
                     previousEndDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
                     periodMonths = 12;
                } else if (period === 'custom' && from && to) {
                    startDate = new Date(from);
                    endDate = new Date(to);
                    endDate.setHours(23, 59, 59, 999);
                    resetTime(startDate);
                    const diffMs = endDate.getTime() - startDate.getTime();
                    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1);
                    previousEndDate = new Date(startDate.getTime() - 1);
                    previousStartDate = new Date(previousEndDate.getTime() - (diffDays - 1) * 24 * 60 * 60 * 1000);
                    periodMonths = Math.max(1, Math.round(diffDays / 30));
                }

                // Prepare Query Object
                const dateFilter = { gte: startDate, lte: endDate };
                const previousDateFilter = { gte: previousStartDate, lte: previousEndDate };

                // Fetch Data
                const incomes = await prisma.income.findMany({
                    where: { 
                        userId: user.id,
                        deletedAt: null,
                        date: dateFilter
                    },
                    orderBy: { date: 'asc' },
                    select: { amount: true, date: true, source: true }
                });
                
                const expenses = await prisma.expense.findMany({
                    where: {
                        userId: user.id,
                        deletedAt: null,
                        date: dateFilter
                    },
                    select: { amount: true, category: true }
                });

                const previousIncomes = await prisma.income.findMany({
                    where: { userId: user.id, deletedAt: null, date: previousDateFilter },
                    select: { amount: true }
                });
                const previousExpenses = await prisma.expense.findMany({
                    where: { userId: user.id, deletedAt: null, date: previousDateFilter },
                    select: { amount: true }
                });
                
                const totalIncome = incomes.reduce((sum: number, item) => sum + item.amount, 0);
                const totalExpenses = expenses.reduce((sum: number, item) => sum + item.amount, 0);
                const netProfit = totalIncome - totalExpenses;
                const singleTax = totalIncome * taxRate + fixedMonthlyTax * periodMonths;
                const esv = esvMonthly * periodMonths;
                const tax = singleTax + esv;

                const prevIncomeTotal = previousIncomes.reduce((sum: number, item) => sum + item.amount, 0);
                const prevExpensesTotal = previousExpenses.reduce((sum: number, item) => sum + item.amount, 0);
                const prevNetProfit = prevIncomeTotal - prevExpensesTotal;
                const prevSingleTax = prevIncomeTotal * taxRate + fixedMonthlyTax * periodMonths;
                const prevEsv = esvMonthly * periodMonths;
                const prevTax = prevSingleTax + prevEsv;

                const incomeChange = prevIncomeTotal === 0 ? (totalIncome > 0 ? 100 : 0) : ((totalIncome - prevIncomeTotal) / prevIncomeTotal) * 100;
                const expensesChange = prevExpensesTotal === 0 ? (totalExpenses > 0 ? 100 : 0) : ((totalExpenses - prevExpensesTotal) / prevExpensesTotal) * 100;
                const netProfitChange = prevNetProfit === 0 ? (netProfit > 0 ? 100 : 0) : ((netProfit - prevNetProfit) / prevNetProfit) * 100;
                const taxChange = prevTax === 0 ? (tax > 0 ? 100 : 0) : ((tax - prevTax) / prevTax) * 100;

                const yearlyIncomes = await prisma.income.findMany({
                    where: {
                        userId: user.id,
                        deletedAt: null,
                        date: { gte: new Date(new Date().getFullYear(), 0, 1) }
                    },
                    select: { amount: true }
                });
                const yearTotalIncome = yearlyIncomes.reduce((sum: number, i) => sum + i.amount, 0);

                // Chart Data Preparation
                // Group by month for chart
                const incomeMap = new Map<string, number>();
                incomes.forEach(i => {
                    const key = new Date(i.date).toLocaleDateString('uk-UA', { month: 'short', day: period === 'month' ? 'numeric' : undefined });
                    incomeMap.set(key, (incomeMap.get(key) || 0) + i.amount);
                });
                const incomeDynamics = Array.from(incomeMap.entries()).map(([date, amount]) => ({ date, amount, type: 'income' as const }));

                // Structure
                const incomeSourceMap = new Map<string, number>();
                incomes.forEach(i => incomeSourceMap.set(i.source, (incomeSourceMap.get(i.source) || 0) + i.amount));
                const incomeStructure = Array.from(incomeSourceMap.entries())
                    .map(([name, value], i) => ({ name, value, color: ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981'][i % 4] }));

                const expenseCatMap = new Map<string, number>();
                expenses.forEach((e: { category: string; amount: number }) => expenseCatMap.set(e.category, (expenseCatMap.get(e.category) || 0) + e.amount));
                const expenseStructure = Array.from(expenseCatMap.entries())
                     .map(([name, value], i) => ({ name, value, color: ['#ef4444', '#f97316', '#eab308', '#64748b'][i % 4] }));

                const limitPercent = incomeLimit > 0 ? (yearTotalIncome / incomeLimit) * 100 : 0;
                let limitStatus: 'ok' | 'warning' | 'danger' = 'ok';
                if (limitPercent > 80) limitStatus = 'warning';
                if (limitPercent > 90) limitStatus = 'danger';

                const topIncomeSource = incomeStructure.sort((a, b) => b.value - a.value)[0];
                const topExpenseCategory = expenseStructure.sort((a, b) => b.value - a.value)[0];
                const topIncomeShare = totalIncome > 0 && topIncomeSource ? (topIncomeSource.value / totalIncome) * 100 : 0;
                const topExpenseShare = totalExpenses > 0 && topExpenseCategory ? (topExpenseCategory.value / totalExpenses) * 100 : 0;
                const marginPercent = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;
                const taxBurdenPercent = totalIncome > 0 ? (tax / totalIncome) * 100 : 0;

                const insights: StatisticsData["insights"] = [
                    {
                        id: "income-trend",
                        title: incomeChange >= 0 ? "Динаміка доходу позитивна" : "Падіння доходу",
                        description: `Зміна доходу становить ${incomeChange.toFixed(1)}% проти попереднього періоду.`,
                        type: incomeChange >= 0 ? "growth" : "risk"
                    },
                    {
                        id: "margin",
                        title: marginPercent >= 35 ? "Маржинальність в нормі" : "Маржинальність просідає",
                        description: `Поточна маржа: ${marginPercent.toFixed(1)}%. Витрати складають ${totalIncome > 0 ? ((totalExpenses / totalIncome) * 100).toFixed(1) : "0.0"}% від доходу.`,
                        type: marginPercent >= 35 ? "growth" : marginPercent >= 20 ? "neutral" : "risk"
                    },
                    {
                        id: "focus",
                        title: topIncomeSource ? `Найсильніший канал: ${topIncomeSource.name}` : "Недостатньо даних по доходах",
                        description: topIncomeSource
                          ? `${topIncomeShare.toFixed(1)}% доходу приходить з одного джерела. ${topIncomeShare > 65 ? "Рекомендується диверсифікація." : "Структура доходу збалансована."}`
                          : "Додайте доходи, щоб отримати аналітику по джерелах.",
                        type: topIncomeShare > 65 ? "risk" : "neutral"
                    },
                    {
                        id: "cost-driver",
                        title: topExpenseCategory ? `Головна стаття витрат: ${topExpenseCategory.name}` : "Недостатньо даних по витратах",
                        description: topExpenseCategory
                          ? `${topExpenseShare.toFixed(1)}% витрат у цій категорії. ${topExpenseShare > 45 ? "Перевірте, чи можна оптимізувати цю статтю." : "Розподіл витрат без критичної концентрації."}`
                          : "Додайте витрати, щоб бачити драйвери витрат.",
                        type: topExpenseShare > 45 ? "risk" : "neutral"
                    },
                    {
                        id: "tax-load",
                        title: "Податкове навантаження",
                        description: `Податки за період: ${tax.toLocaleString("uk-UA")} ₴ (${taxBurdenPercent.toFixed(1)}% від доходу).`,
                        type: taxBurdenPercent > 20 ? "risk" : "neutral"
                    }
                ];

                const insightsWithLimit: StatisticsData["insights"] = incomeLimit > 0
                  ? [
                      ...insights,
                      {
                        id: "limit",
                        title: limitPercent > 80 ? "Обережно з річним лімітом" : "Ліміт під контролем",
                        description: `Використано ${limitPercent.toFixed(1)}% річного ліміту.`,
                        type: (limitPercent > 80 ? "risk" : "neutral") as "risk" | "neutral",
                      },
                    ]
                  : insights;

                return {
                    period,
                    kpi: {
                        income: { total: totalIncome, change: parseFloat(incomeChange.toFixed(1)) },
                        expenses: { total: totalExpenses, change: parseFloat(expensesChange.toFixed(1)) },
                        netProfit: { total: netProfit, change: parseFloat(netProfitChange.toFixed(1)) },
                        tax: { total: tax, change: parseFloat(taxChange.toFixed(1)) }
                    },
                    charts: {
                        incomeDynamics,
                        incomeStructure,
                        expenseStructure
                    },
                    fop: {
                        limit: {
                            current: yearTotalIncome,
                            max: incomeLimit,
                            percent: parseFloat(limitPercent.toFixed(1)),
                            status: limitStatus
                        }
                    },
                    insights: insightsWithLimit
                };

            } catch (error) {
                console.error("Stats Error:", error);
                return null;
            }
        },
        [`stats-${user.id}-${period}-${from}-${to}`],
        { tags: ['dashboard-stats', `user-${user.id}`], revalidate: 3600 }
    )());
    }, { budgetMs: 900, meta: { period } });
}
