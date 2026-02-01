"use server";

import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getIncomes() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  try {
    const incomes = await prisma.income.findMany({
      where: { userId: user.id },
      orderBy: { date: 'desc' },
      take: 50
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
  
    if (!user) return { total: 0, change: 0, chartData: [] };
  
    try {
        // This is a simplified stats calculation. 
        // In a real app, you'd aggregate by month using SQL or Prisma groupBy
        const incomes = await prisma.income.findMany({
            where: { userId: user.id },
            orderBy: { date: 'asc' }
        });
        
        const total = incomes.reduce((acc, curr) => acc + curr.amount, 0);
        
        // Mock chart data generation based on real data dates
        // Group by month
        const monthMap = new Map<string, number>();
        const months = ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер", "Лип", "Сер", "Вер", "Жов", "Лис", "Гру"];
        
        // Initialize current year months
        months.forEach(m => monthMap.set(m, 0));

        incomes.forEach(inc => {
            const date = new Date(inc.date);
            const monthIndex = date.getMonth();
            const monthName = months[monthIndex];
            monthMap.set(monthName, (monthMap.get(monthName) || 0) + inc.amount);
        });

        const chartData = Array.from(monthMap.entries()).map(([name, income]) => ({ name, income }));

        return {
            total,
            change: 12.5, // Mocked for now, needs previous period comparison logic
            chartData
        };
    } catch (e) {
        return { total: 0, change: 0, chartData: [] };
    }
}
