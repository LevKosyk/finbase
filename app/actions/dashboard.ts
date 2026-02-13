"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

import { unstable_cache } from "next/cache";
import { formatDateUA, getNextDueDate, getPeriodRange, getReportingPeriod, getStatusFromDueDate } from "@/lib/fop";
import { cacheKey, withRedisCache } from "@/lib/redis-cache";

export async function getDashboardStats() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const redisKey = cacheKey("user", user.id, "dashboard-stats");
    return withRedisCache(redisKey, 120, async () => await unstable_cache(
        async () => {
            try {
                // Fetch user settings for FOP group
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    include: { settings: true }
                });

                const fopGroup = dbUser?.settings?.group || 3;
                const reportingPeriod = getReportingPeriod(dbUser?.settings?.reportingPeriod);
                const taxRate = dbUser?.settings?.taxRate || 0;
                const fixedMonthlyTax = dbUser?.settings?.fixedMonthlyTax || 0;
                const esvMonthly = dbUser?.settings?.esvMonthly || 0;
                const incomeLimit = dbUser?.settings?.incomeLimit || 0;
                const taxPaymentDay = dbUser?.settings?.taxPaymentDay || null;

                // Fetch Income
                const incomes = await prisma.income.findMany({
                    where: { userId: user.id },
                    orderBy: { date: 'asc' }
                });

                const now = new Date();
                const currentYear = now.getFullYear();
                const currentYearIncomes = incomes.filter(i => new Date(i.date).getFullYear() === currentYear);
                const totalIncome = currentYearIncomes.reduce((acc, curr) => acc + curr.amount, 0);

                const previousYearIncomes = incomes.filter(i => new Date(i.date).getFullYear() === currentYear - 1);
                const lastYearToDate = previousYearIncomes.filter(i => {
                    const d = new Date(i.date);
                    const cutoff = new Date(currentYear - 1, now.getMonth(), now.getDate(), 23, 59, 59, 999);
                    return d <= cutoff;
                });
                const lastYearTotal = lastYearToDate.reduce((acc, curr) => acc + curr.amount, 0);
                const incomeChange = lastYearTotal === 0 ? (totalIncome > 0 ? 100 : 0) : ((totalIncome - lastYearTotal) / lastYearTotal) * 100;

                // Chart Data (Group by Month)
                const months = ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"];
                const monthMap = new Map<string, number>();
                months.forEach(m => monthMap.set(m, 0));
                
                currentYearIncomes.forEach(inc => {
                    const m = months[new Date(inc.date).getMonth()];
                    monthMap.set(m, (monthMap.get(m) || 0) + inc.amount);
                });
                const incomeHistory = Array.from(monthMap.entries()).map(([name, value]) => ({ name, value }));

                const { start: periodStart, end: periodEnd, months: periodMonths } = getPeriodRange(reportingPeriod, now);
                const periodIncomes = incomes.filter(i => {
                    const d = new Date(i.date);
                    return d >= periodStart && d <= periodEnd;
                });
                const periodIncomeTotal = periodIncomes.reduce((acc, curr) => acc + curr.amount, 0);
                const singleTax = periodIncomeTotal * taxRate + fixedMonthlyTax * periodMonths;
                const esv = esvMonthly * periodMonths;
                const taxAmount = singleTax + esv;
                const nextDue = getNextDueDate(reportingPeriod, taxPaymentDay, now);
                const nextPaymentDate = formatDateUA(nextDue);
                const taxStatus = getStatusFromDueDate(nextDue);

                const expenses = await prisma.expense.findMany({
                    where: { userId: user.id },
                    orderBy: { date: 'asc' }
                });
                const currentYearExpenses = expenses.filter(e => new Date(e.date).getFullYear() === currentYear);
                const expensesTotal = currentYearExpenses.reduce((acc, curr) => acc + curr.amount, 0);
                const previousYearExpenses = expenses.filter(e => new Date(e.date).getFullYear() === currentYear - 1);
                const lastYearExpensesToDate = previousYearExpenses.filter(e => {
                    const d = new Date(e.date);
                    const cutoff = new Date(currentYear - 1, now.getMonth(), now.getDate(), 23, 59, 59, 999);
                    return d <= cutoff;
                });
                const lastYearExpensesTotal = lastYearExpensesToDate.reduce((acc, curr) => acc + curr.amount, 0);
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
}

export async function getReminders() {
    // In a real app, this would fetch from a 'Tasks' table or generate dynamic alerts
    return [
        { id: 1, title: "Сплатити ЄП за 1 квартал", date: "до 19.04", type: "tax", completed: false },
        { id: 2, title: "Подати декларацію", date: "до 09.04", type: "report", completed: false },
        { id: 3, title: "Перевірити ліміт доходу", date: "сьогодні", type: "alert", completed: true },
    ];
}
