"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export interface DashboardStats {
    income: {
        total: number;
        change: number; // percentage
        history: { name: string; value: number }[];
    };
    expenses: {
        total: number;
        change: number;
    };
    tax: {
        amount: number;
        status: 'ok' | 'warning' | 'danger';
        nextPaymentDate: string;
    };
    limit: {
        current: number;
        max: number; // 3rd group limit ~8.2m UAH
        percent: number;
    };
    fop: {
        group: number;
        taxSystem: string;
    };
}

export async function getDashboardStats() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    try {
        // Fetch user settings for FOP group
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { settings: true }
        });

        const fopGroup = dbUser?.settings?.group || 3;
        const taxRate = 0.05; // Assuming 5% for now for group 3
        const fopLimit = 8286000; // 2024 Limit for Group 3

        // Fetch Income
        const incomes = await prisma.income.findMany({
            where: { userId: user.id },
            orderBy: { date: 'asc' }
        });

        // Calculate Total Income (YTD or All time? Let's say current year)
        const currentYear = new Date().getFullYear();
        const currentYearIncomes = incomes.filter(i => new Date(i.date).getFullYear() === currentYear);
        const totalIncome = currentYearIncomes.reduce((acc, curr) => acc + curr.amount, 0);

        // Chart Data (Group by Month)
        const months = ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"];
        const monthMap = new Map<string, number>();
        months.forEach(m => monthMap.set(m, 0));
        
        currentYearIncomes.forEach(inc => {
            const m = months[new Date(inc.date).getMonth()];
            monthMap.set(m, (monthMap.get(m) || 0) + inc.amount);
        });
        const incomeHistory = Array.from(monthMap.entries()).map(([name, value]) => ({ name, value }));

        // Calculate Tax (Simulated)
        // Group 3: 5% of income
        const taxAmount = totalIncome * taxRate; 
        // Logic for next payment date (Quarterly)
        const nextPaymentDate = "19.04.2026"; // Example
        
        // Mock Expenses (No table yet)
        const expensesTotal = 12400; 

        return {
            income: {
                total: totalIncome,
                change: 12.5,
                history: incomeHistory
            },
            expenses: {
                total: expensesTotal,
                change: -2.4
            },
            tax: {
                amount: taxAmount,
                status: 'ok' as 'ok' | 'warning' | 'danger', // Logic: if today > deadline then danger
                nextPaymentDate
            },
            limit: {
                current: totalIncome,
                max: fopLimit,
                percent: (totalIncome / fopLimit) * 100
            },
            fop: {
                group: fopGroup,
                taxSystem: "Єдиний податок 5%"
            }
        };

    } catch (e) {
        console.error(e);
        return null;
    }
}

export async function getReminders() {
    // In a real app, this would fetch from a 'Tasks' table or generate dynamic alerts
    return [
        { id: 1, title: "Сплатити ЄП за 1 квартал", date: "до 19.04", type: "tax", completed: false },
        { id: 2, title: "Подати декларацію", date: "до 09.04", type: "report", completed: false },
        { id: 3, title: "Перевірити ліміт доходу", date: "сьогодні", type: "alert", completed: true },
    ];
}
