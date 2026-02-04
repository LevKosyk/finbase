"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type IncomeData = {
    amount: number;
    source: string;
    date: Date;
    type: string;
    status: string;
}

export async function createIncome(data: IncomeData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    try {
        await prisma.income.create({
            data: {
                userId: user.id,
                amount: data.amount,
                source: data.source,
                date: data.date,
                type: data.type,
                status: data.status || 'completed'
            }
        });
        revalidatePath('/dashboard/income');
        return { success: true };
    } catch (error) {
        console.error("Failed to create income:", error);
        return { success: false, error: "Failed to create income" };
    }
}

export async function updateIncome(id: string, data: Partial<IncomeData>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    try {
        await prisma.income.update({
            where: { id, userId: user.id },
            data
        });
        revalidatePath('/dashboard/income');
        return { success: true };
    } catch (error) {
        console.error("Failed to update income:", error);
        return { success: false, error: "Failed to update income" };
    }
}

export async function deleteIncome(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    try {
        await prisma.income.delete({
            where: { id, userId: user.id }
        });
        revalidatePath('/dashboard/income');
        return { success: true };
    } catch (error) {
        console.error("Failed to delete income:", error);
        return { success: false, error: "Failed to delete income" };
    }
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
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  try {
    const filters: any = { userId: user.id };

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

    const incomes = await prisma.income.findMany({
      where: filters,
      orderBy: { date: 'desc' },
      take: 100
    });
    return incomes;
  } catch (error) {
    console.error("Error fetching incomes:", error);
    return [];
  }
}

export async function getIncomeStats() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
  
    if (!user) return { total: 0, change: 0, average: 0, pending: 0, chartData: [] };
  
    try {
        const incomes = await prisma.income.findMany({
            where: { userId: user.id },
            orderBy: { date: 'asc' }
        });
        
        // Filter for current month/year if needed, for now getting all-time or simplified view
        // Let's assume stats for "Current Month" vs "Last Month"
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const thisMonthIncomes = incomes.filter(i => {
            const d = new Date(i.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const total = thisMonthIncomes.reduce((acc, curr) => acc + curr.amount, 0);
        const average = thisMonthIncomes.length > 0 ? total / thisMonthIncomes.length : 0;
        
        const totalAllTime = incomes.reduce((acc, curr) => acc + curr.amount, 0); // Or use this for total card
        
        // Mock chart data
        const monthMap = new Map<string, number>();
        const months = ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"];
        
        const currentYearIncomes = incomes.filter(i => new Date(i.date).getFullYear() === currentYear);
        
        currentYearIncomes.forEach(inc => {
            const m = months[new Date(inc.date).getMonth()];
            monthMap.set(m, (monthMap.get(m) || 0) + inc.amount);
        });
        
        // Fill 0 for months
        const chartData = months.map(m => ({ name: m, income: monthMap.get(m) || 0 }));

        return {
            total,
            change: 12.5,
            average,
            pending: 0, // Mock
            chartData
        };
    } catch (e) {
        return { total: 0, change: 0, average: 0, pending: 0, chartData: [] };
    }
}
