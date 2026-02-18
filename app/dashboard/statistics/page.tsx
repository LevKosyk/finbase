
import StatisticsFilters from "@/components/dashboard/statistics/StatisticsFilters";
import { getStatistics } from "@/app/actions/statistics";
import DataState from "@/components/ui/DataState";
import { isDynamicServerUsageError } from "@/lib/is-dynamic-server-error";
import StatisticsLiveSection from "@/components/dashboard/statistics/StatisticsLiveSection";
import { isFeatureEnabled } from "@/lib/feature-flags";
import PageShell from "@/components/dashboard/shared/PageShell";

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
    <PageShell title="Статистика" description="Детальний розріз доходів, витрат, лімітів і податкових показників.">
      <section className="space-y-4">
        <StatisticsFilters />
        <StatisticsLiveSection initialStats={stats} period={period} from={from} to={to} />
      </section>
    </PageShell>
  );
}
