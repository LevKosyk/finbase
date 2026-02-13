"use client";

import { ArrowDownRight, ArrowUpRight, TrendingUp, Wallet, Receipt, PieChart } from "lucide-react";
import type { ReactNode } from "react";

interface StatsData {
    kpi: {
        income: { total: number; change: number };
        expenses: { total: number; change: number };
        netProfit: { total: number; change: number };
        tax: { total: number; change: number };
    };
}

type CardColor = "blue" | "orange" | "green" | "purple";

export default function KPIGrid({ stats }: { stats: StatsData }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KPICard 
                title="Загальний дохід" 
                amount={stats.kpi.income.total} 
                change={stats.kpi.income.change} 
                icon={<Wallet className="w-5 h-5" />}
                color="blue"
            />
             <KPICard 
                title="Витрати" 
                amount={stats.kpi.expenses.total} 
                change={stats.kpi.expenses.change} 
                icon={<Receipt className="w-5 h-5" />}
                color="orange"
                isExpense
            />
             <KPICard 
                title="Чистий прибуток" 
                amount={stats.kpi.netProfit.total} 
                change={stats.kpi.netProfit.change} 
                icon={<PieChart className="w-5 h-5" />}
                color="green"
            />
             <KPICard 
                title="Податки (5%)" 
                amount={stats.kpi.tax.total} 
                change={stats.kpi.tax.change} 
                icon={<TrendingUp className="w-5 h-5" />}
                color="purple"
                isExpense
            />
        </div>
    );
}

function KPICard({
    title,
    amount,
    change,
    icon,
    color,
    isExpense,
}: {
    title: string;
    amount: number;
    change: number;
    icon: ReactNode;
    color: CardColor;
    isExpense?: boolean;
}) {
    const isPositive = change > 0;
    const isGood = isExpense ? !isPositive : isPositive;
    
    // Color variants
    const bgColors: Record<CardColor, string> = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
        orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300',
        green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300',
        purple: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300',
    };

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] hover:shadow-xl transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${bgColors[color]}`}>
                    {icon}
                </div>
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                    isGood ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-300' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300'
                }`}>
                    {isPositive ? '+' : ''}{change}%
                    {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-1 ml-1">{title}</p>
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                {amount.toLocaleString('uk-UA')} ₴
            </h3>
        </div>
    );
}
