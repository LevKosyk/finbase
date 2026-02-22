"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

import { unstable_cache } from "next/cache";
import { formatDateUA, getNextDueDate, getPeriodRange, getReportingPeriod, getStatusFromDueDate } from "@/lib/fop";
import { cacheKey, withRedisCache } from "@/lib/redis-cache";
import { measureAction } from "@/lib/performance";
import { enforceUserFopGroup3 } from "@/lib/fop-group-guard";

export async function getDashboardStats() {
    return measureAction("action.getDashboardStats", async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;
    await enforceUserFopGroup3(user.id, "action.dashboard.stats");

    const redisKey = cacheKey("user", user.id, "dashboard-stats");
    return withRedisCache(redisKey, 120, async () => await unstable_cache(
        async () => {
            try {
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    select: {
                      settings: {
                        select: {
                          group: true,
                          reportingPeriod: true,
                          taxRate: true,
                          fixedMonthlyTax: true,
                          esvMonthly: true,
                          incomeLimit: true,
                          taxPaymentDay: true,
                        },
                      },
                    },
                });

                const fopGroup = dbUser?.settings?.group || 3;
                const reportingPeriod = getReportingPeriod(dbUser?.settings?.reportingPeriod);
                const taxRate = dbUser?.settings?.taxRate || 0;
                const fixedMonthlyTax = dbUser?.settings?.fixedMonthlyTax || 0;
                const esvMonthly = dbUser?.settings?.esvMonthly || 0;
                const incomeLimit = dbUser?.settings?.incomeLimit || 0;
                const taxPaymentDay = dbUser?.settings?.taxPaymentDay || null;

                const now = new Date();
                const currentYear = now.getFullYear();
                const startCurrentYear = new Date(currentYear, 0, 1);
                const startNextYear = new Date(currentYear + 1, 0, 1);
                const startPreviousYear = new Date(currentYear - 1, 0, 1);
                const previousYearCutoff = new Date(currentYear - 1, now.getMonth(), now.getDate(), 23, 59, 59, 999);

                const [currentIncomeAgg, lastYearToDateIncomeAgg, currentExpenseAgg, lastYearToDateExpenseAgg, monthlyRows] = await Promise.all([
                    prisma.income.aggregate({
                        where: { userId: user.id, deletedAt: null, date: { gte: startCurrentYear, lt: startNextYear } },
                        _sum: { amount: true },
                    }),
                    prisma.income.aggregate({
                        where: { userId: user.id, deletedAt: null, date: { gte: startPreviousYear, lte: previousYearCutoff } },
                        _sum: { amount: true },
                    }),
                    prisma.expense.aggregate({
                        where: { userId: user.id, deletedAt: null, date: { gte: startCurrentYear, lt: startNextYear } },
                        _sum: { amount: true },
                    }),
                    prisma.expense.aggregate({
                        where: { userId: user.id, deletedAt: null, date: { gte: startPreviousYear, lte: previousYearCutoff } },
                        _sum: { amount: true },
                    }),
                    prisma.$queryRaw<Array<{ month: Date; total: number }>>(Prisma.sql`
                      SELECT date_trunc('month', "date") AS month, COALESCE(SUM("amount"), 0)::float AS total
                      FROM "Income"
                      WHERE "userId" = ${user.id}
                        AND "deletedAt" IS NULL
                        AND "date" >= ${startCurrentYear}
                        AND "date" < ${startNextYear}
                      GROUP BY 1
                      ORDER BY 1 ASC
                    `),
                ]);

                const totalIncome = currentIncomeAgg._sum.amount || 0;
                const lastYearTotal = lastYearToDateIncomeAgg._sum.amount || 0;
                const incomeChange = lastYearTotal === 0 ? (totalIncome > 0 ? 100 : 0) : ((totalIncome - lastYearTotal) / lastYearTotal) * 100;

                const months = ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"];
                const monthMap = new Map<string, number>();
                months.forEach(m => monthMap.set(m, 0));

                monthlyRows.forEach((row) => {
                    const monthIdx = new Date(row.month).getMonth();
                    const m = months[monthIdx];
                    monthMap.set(m, (monthMap.get(m) || 0) + Number(row.total || 0));
                });
                const incomeHistory = Array.from(monthMap.entries()).map(([name, value]) => ({ name, value }));

                const { start: periodStart, end: periodEnd, months: periodMonths } = getPeriodRange(reportingPeriod, now);
                const periodIncomeAgg = await prisma.income.aggregate({
                    where: {
                        userId: user.id,
                        deletedAt: null,
                        date: { gte: periodStart, lte: periodEnd },
                    },
                    _sum: { amount: true },
                });
                const periodIncomeTotal = periodIncomeAgg._sum.amount || 0;
                const singleTax = periodIncomeTotal * taxRate + fixedMonthlyTax * periodMonths;
                const esv = esvMonthly * periodMonths;
                const taxAmount = singleTax + esv;
                const nextDue = getNextDueDate(reportingPeriod, taxPaymentDay, now);
                const nextPaymentDate = formatDateUA(nextDue);
                const taxStatus = getStatusFromDueDate(nextDue);

                const expensesTotal = currentExpenseAgg._sum.amount || 0;
                const lastYearExpensesTotal = lastYearToDateExpenseAgg._sum.amount || 0;
                const expensesChange = lastYearExpensesTotal === 0 ? (expensesTotal > 0 ? 100 : 0) : ((expensesTotal - lastYearExpensesTotal) / lastYearExpensesTotal) * 100;

                return {
                    income: {
                        total: totalIncome,
                        change: parseFloat(incomeChange.toFixed(1)),
                        history: incomeHistory
                    },
                    expenses: {
                        total: expensesTotal,
                        change: parseFloat(expensesChange.toFixed(1))
                    },
                    tax: {
                        amount: taxAmount,
                        singleTax,
                        esv,
                        status: taxStatus,
                        nextPaymentDate
                    },
                    limit: {
                        current: totalIncome,
                        max: incomeLimit,
                        percent: incomeLimit > 0 ? (totalIncome / incomeLimit) * 100 : 0
                    },
                    fop: {
                        group: fopGroup,
                        taxSystem: taxRate > 0 ? `ЄП ${Math.round(taxRate * 1000) / 10}%` : (fixedMonthlyTax > 0 ? "ЄП фіксований" : "ЄП"),
                        reportingPeriod
                    }
                };

            } catch (e) {
                console.error(e);
                return null;
            }
        },
        [`dashboard-stats-${user.id}`],
        { tags: ['dashboard-stats', `user-${user.id}`], revalidate: 3600 } 
    )());
    });
}

export async function getReminders() {
    return [
        { id: 1, title: "Сплатити ЄП за 1 квартал", date: "до 19.04", type: "tax", completed: false },
        { id: 2, title: "Подати декларацію", date: "до 09.04", type: "report", completed: false },
        { id: 3, title: "Перевірити ліміт доходу", date: "сьогодні", type: "alert", completed: true },
    ];
}

export async function getRecentTransactions(limit = 5) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    try {
        const incomes = await prisma.income.findMany({
            where: { userId: user.id, deletedAt: null },
            orderBy: { date: "desc" },
            take: limit,
            select: { id: true, amount: true, source: true, date: true, type: true },
        });
        return incomes.map((i) => ({
            id: i.id,
            amount: Number(i.amount),
            source: i.source,
            date: i.date.toISOString(),
            type: i.type,
        }));
    } catch {
        return [];
    }
}
