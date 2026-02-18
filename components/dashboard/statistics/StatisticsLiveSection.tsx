"use client";

import useSWR from "swr";
import DataState from "@/components/ui/DataState";
import type { StatisticsData } from "@/lib/types/statistics";
import KPIGrid from "@/components/dashboard/statistics/KPIGrid";
import IncomeChart from "@/components/dashboard/statistics/IncomeChart";
import ExpenseStructure from "@/components/dashboard/statistics/ExpenseStructure";
import FOPLimitWidget from "@/components/dashboard/statistics/FOPLimitWidget";
import StatisticsHighlights from "@/components/dashboard/statistics/StatisticsHighlights";

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
    <section className="space-y-6">
      <KPIGrid stats={stats} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <IncomeChart data={stats.charts.incomeDynamics} />
        </div>
        <div>
          <StatisticsHighlights stats={stats} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <FOPLimitWidget stats={stats.fop.limit} />
        </div>
        <div>
          <ExpenseStructure data={stats.charts.expenseStructure} />
        </div>
      </div>
    </section>
  );
}
