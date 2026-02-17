
import StatisticsFilters from "@/components/dashboard/statistics/StatisticsFilters";
import { getStatistics } from "@/app/actions/statistics";
import DataState from "@/components/ui/DataState";
import { isDynamicServerUsageError } from "@/lib/is-dynamic-server-error";
import StatisticsLiveSection from "@/components/dashboard/statistics/StatisticsLiveSection";
import { isFeatureEnabled } from "@/lib/feature-flags";

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const enabled = await isFeatureEnabled("statistics_module");
  if (!enabled) {
    return (
      <div className="pb-12 max-w-7xl mx-auto">
        <DataState
          variant="empty"
          title="Модуль статистики вимкнено"
          description="Адміністратор тимчасово вимкнув модуль через feature flag."
        />
      </div>
    );
  }

  const resolvedSearchParams = await searchParams;
  const period = (resolvedSearchParams?.period as 'month' | 'quarter' | 'year' | 'custom') || 'year';
  const from = resolvedSearchParams?.from as string | undefined;
  const to = resolvedSearchParams?.to as string | undefined;
  let stats: Awaited<ReturnType<typeof getStatistics>> = null;
  try {
    stats = await getStatistics(period, from, to);
  } catch (error) {
    if (isDynamicServerUsageError(error)) throw error;
    console.error("Statistics page error:", error);
    return (
      <div className="pb-12 max-w-7xl mx-auto">
        <DataState
          variant="error"
          title="Не вдалося завантажити статистику"
          description="Сталася помилка під час розрахунків. Спробуйте ще раз."
        />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="pb-12 max-w-7xl mx-auto">
        <DataState
          variant="error"
          title="Немає доступної статистики"
          description="Не вдалося отримати дані для цієї вибірки. Перевірте фільтри та спробуйте ще раз."
        />
      </div>
    );
  }

  return (
    <div className="pb-12 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">Глибока Аналітика</h1>
           <p className="text-gray-500 dark:text-gray-400 text-lg">Детальний розріз доходів та вітрат</p>
        </div>
      </div>

      <StatisticsFilters />

      <StatisticsLiveSection initialStats={stats} period={period} from={from} to={to} />

    </div>
  );
}
