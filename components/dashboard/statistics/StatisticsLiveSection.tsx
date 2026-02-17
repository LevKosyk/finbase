"use client";

import useSWR from "swr";
import dynamic from "next/dynamic";
import DataState from "@/components/ui/DataState";
import type { StatisticsData } from "@/lib/types/statistics";

const KPIGrid = dynamic(() => import("@/components/dashboard/statistics/KPIGrid"));
const IncomeChart = dynamic(() => import("@/components/dashboard/statistics/IncomeChart"), {
  loading: () => <div className="h-[360px] rounded-[2rem] border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 animate-pulse" />,
});
const ExpenseStructure = dynamic(() => import("@/components/dashboard/statistics/ExpenseStructure"), {
  loading: () => <div className="h-[300px] rounded-[2rem] border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 animate-pulse" />,
});
const FOPLimitWidget = dynamic(() => import("@/components/dashboard/statistics/FOPLimitWidget"));
const AIInsightsMock = dynamic(() => import("@/components/dashboard/statistics/AIInsightsMock"), {
  loading: () => <div className="h-[300px] rounded-[2rem] border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 animate-pulse" />,
});

const fetcher = async (url: string): Promise<{ stats: StatisticsData | null }> => {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch statistics");
  return response.json();
};

export default function StatisticsLiveSection({
  initialStats,
  period,
  from,
  to,
}: {
  initialStats: StatisticsData;
  period: "month" | "quarter" | "year" | "custom";
  from?: string;
  to?: string;
}) {
  const params = new URLSearchParams({ period });
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  const key = `/api/dashboard/statistics?${params.toString()}`;
  const { data, error } = useSWR(key, fetcher, {
    fallbackData: { stats: initialStats },
    refreshInterval: 60000,
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    keepPreviousData: true,
  });

  if (error) {
    return (
      <DataState
        variant="error"
        title="Не вдалося оновити статистику"
        description="Показуємо останні доступні дані. Спробуйте пізніше."
      />
    );
  }

  const stats = data?.stats || initialStats;
  const hasChartData = stats.charts.incomeDynamics.length > 0 || stats.charts.expenseStructure.length > 0;

  if (!hasChartData) {
    return (
      <DataState
        variant="empty"
        title="Ще недостатньо даних для статистики"
        description="Додайте доходи або витрати за вибраний період, щоб побачити аналітику."
      />
    );
  }

  return (
    <>
      <KPIGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <IncomeChart data={stats.charts.incomeDynamics} />
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex-1">
            <AIInsightsMock insights={stats.insights} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ExpenseStructure data={stats.charts.expenseStructure} />
        </div>
        <div className="lg:col-span-2">
          <FOPLimitWidget stats={stats.fop.limit} />
        </div>
      </div>
    </>
  );
}
