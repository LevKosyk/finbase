"use client";

import type { StatisticsData } from "@/lib/types/statistics";

function formatUAH(value: number) {
  return `${value.toLocaleString("uk-UA")} ₴`;
}

export default function StatisticsHighlights({ stats }: { stats: StatisticsData }) {
  const income = stats.kpi.income.total;
  const expenses = stats.kpi.expenses.total;
  const net = stats.kpi.netProfit.total;
  const tax = stats.kpi.tax.total;
  const margin = income > 0 ? (net / income) * 100 : 0;
  const taxLoad = income > 0 ? (tax / income) * 100 : 0;

  const topIncome = [...stats.charts.incomeStructure].sort((a, b) => b.value - a.value)[0];
  const topExpense = [...stats.charts.expenseStructure].sort((a, b) => b.value - a.value)[0];
  const avgIncomePoint =
    stats.charts.incomeDynamics.length > 0
      ? stats.charts.incomeDynamics.reduce((sum, item) => sum + item.amount, 0) / stats.charts.incomeDynamics.length
      : 0;

  const rows = [
    { label: "Середній дохід (точка графіка)", value: formatUAH(avgIncomePoint) },
    { label: "Маржинальність", value: `${margin.toFixed(1)}%` },
    { label: "Податкове навантаження", value: `${taxLoad.toFixed(1)}%` },
    { label: "Головне джерело доходу", value: topIncome ? `${topIncome.name} (${formatUAH(topIncome.value)})` : "Немає даних" },
    { label: "Найбільша категорія витрат", value: topExpense ? `${topExpense.name} (${formatUAH(topExpense.value)})` : "Немає даних" },
    { label: "Відношення витрат до доходу", value: income > 0 ? `${((expenses / income) * 100).toFixed(1)}%` : "0.0%" },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm h-full">
      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Ключові показники</h3>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{row.label}</p>
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

