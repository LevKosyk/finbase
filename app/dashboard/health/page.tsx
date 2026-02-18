import { getHealthDashboard } from "@/app/actions/health";
import DataState from "@/components/ui/DataState";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import PageShell from "@/components/dashboard/shared/PageShell";

function riskLabel(score: number) {
  if (score >= 70) return { text: "Високий ризик", color: "text-red-700 bg-red-50" };
  if (score >= 40) return { text: "Середній ризик", color: "text-amber-700 bg-amber-50" };
  return { text: "Низький ризик", color: "text-emerald-700 bg-emerald-50" };
}

export default async function HealthPage() {
  const enabled = await isFeatureEnabled("fop_health");
  if (!enabled) {
    return (
      <div className="max-w-7xl mx-auto pb-10">
        <DataState
          variant="empty"
          title="Модуль здоров&apos;я ФОП вимкнено"
          description="Адміністратор тимчасово вимкнув модуль через feature flag."
        />
      </div>
    );
  }

  const data = await getHealthDashboard();
  if (!data) {
    return <div className="p-6 bg-white rounded-2xl border border-gray-200">Заповніть налаштування ФОП і додайте операції для розрахунку здоров&apos;я.</div>;
  }

  const label = riskLabel(data.riskScore);

  return (
    <PageShell
      title="Здоров&apos;я ФОП"
      description="Ризик-скор, фактори ризику, прогноз і конкретні дії на сьогодні."
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-3 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm p-6 md:p-8">
          <p className="text-sm font-semibold text-gray-500">Ризик-скор</p>
          <div className="mt-3 flex items-end gap-3">
            <div className="text-5xl font-extrabold text-gray-900 dark:text-gray-100">{data.riskScore}</div>
            <div className="text-sm text-gray-500 mb-1">/100</div>
          </div>
          <div className={`inline-flex mt-4 px-3 py-1.5 rounded-full text-sm font-bold ${label.color}`}>
            {label.text}
          </div>
        </div>

        <div className="xl:col-span-3 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm p-6 md:p-8">
          <p className="text-sm font-semibold text-gray-500">Прогноз</p>
          <div className="mt-4 space-y-2">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2">
              <p className="text-xs text-gray-500">Прогноз ліміту</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{data.forecast.limitUsage}%</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2">
              <p className="text-xs text-gray-500">Прогноз доходу до кінця року</p>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{data.forecast.yearIncome.toLocaleString("uk-UA")} ₴</p>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2">
              <p className="text-xs text-gray-500">Тренд доходу (3 міс)</p>
              <p className={`text-sm font-bold ${data.forecast.incomeMomentum >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {data.forecast.incomeMomentum >= 0 ? "+" : ""}
                {data.forecast.incomeMomentum}%
              </p>
            </div>
          </div>
        </div>

        <div className="xl:col-span-6 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Фактори ризику</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4"><p className="text-xs text-gray-500">Використання ліміту</p><p className="font-bold text-lg text-gray-900 dark:text-gray-100">{data.factors.limitUsage}%</p></div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4"><p className="text-xs text-gray-500">Прострочки</p><p className="font-bold text-lg text-gray-900 dark:text-gray-100">{data.factors.overdueCount}</p></div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4"><p className="text-xs text-gray-500">Термінові до 7 днів</p><p className="font-bold text-lg text-gray-900 dark:text-gray-100">{data.factors.dueSoonCount}</p></div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4"><p className="text-xs text-gray-500">Концентрація доходу</p><p className="font-bold text-lg text-gray-900 dark:text-gray-100">{data.factors.incomeConcentration}%</p></div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4"><p className="text-xs text-gray-500">Ріст витрат vs середнє 3 міс</p><p className="font-bold text-lg text-gray-900 dark:text-gray-100">{data.factors.expenseSpike}%</p></div>
          </div>
        </div>

        <div className="xl:col-span-7 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm p-6 md:p-8">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">Склад ризик-скору</h3>
          <div className="space-y-2">
            {data.scoreBreakdown.map((item) => (
              <div key={item.key} className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.label}</p>
                  <p className="text-xs text-gray-500">
                    Значення: {item.value}
                    {item.unit}
                  </p>
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">+{item.points} балів</div>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-5 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm p-6 md:p-8">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Що зробити сьогодні</h2>
            <p className="text-sm text-gray-500 mt-1">Натисніть на дію, щоб одразу перейти у потрібний розділ.</p>
          </div>
          <div className="space-y-3">
            {data.actionsToday.map((action, idx) => (
              <Link
                key={`${idx}-${action.title}`}
                href={action.href}
                className={`group rounded-xl border px-4 py-3 text-sm font-medium flex items-center justify-between transition-all hover:shadow-sm hover:-translate-y-0.5 ${
                  action.priority === "high"
                    ? "border-red-100 bg-red-50 text-red-900"
                    : action.priority === "medium"
                      ? "border-blue-100 bg-blue-50 text-blue-900"
                      : "border-gray-200 bg-gray-50 text-gray-800"
                }`}
              >
                <div className="pr-3">
                  <p className="font-semibold">{idx + 1}. {action.title}</p>
                  <p className="text-xs opacity-80 mt-0.5">Перейти до дії</p>
                </div>
                <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
