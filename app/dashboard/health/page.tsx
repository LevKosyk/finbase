import { getHealthDashboard } from "@/app/actions/health";

function riskLabel(score: number) {
  if (score >= 70) return { text: "Високий ризик", color: "text-red-700 bg-red-50" };
  if (score >= 40) return { text: "Середній ризик", color: "text-amber-700 bg-amber-50" };
  return { text: "Низький ризик", color: "text-emerald-700 bg-emerald-50" };
}

export default async function HealthPage() {
  const data = await getHealthDashboard();
  if (!data) {
    return <div className="p-6 bg-white rounded-2xl border border-gray-200">Заповніть налаштування ФОП і додайте операції для розрахунку здоров&apos;я.</div>;
  }

  const label = riskLabel(data.riskScore);

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Здоров&apos;я ФОП</h1>
        <p className="text-gray-500 text-lg">Ризик-скор, ключові фактори і дії на сьогодні.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
          <p className="text-sm font-semibold text-gray-500">Ризик-скор</p>
          <div className="mt-3 flex items-end gap-3">
            <div className="text-5xl font-extrabold text-gray-900">{data.riskScore}</div>
            <div className="text-sm text-gray-500 mb-1">/100</div>
          </div>
          <div className={`inline-flex mt-4 px-3 py-1.5 rounded-full text-sm font-bold ${label.color}`}>
            {label.text}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Фактори ризику</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Використання ліміту</p><p className="font-bold text-lg">{data.factors.limitUsage}%</p></div>
            <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Прострочки</p><p className="font-bold text-lg">{data.factors.overdueCount}</p></div>
            <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Термінові до 7 днів</p><p className="font-bold text-lg">{data.factors.dueSoonCount}</p></div>
            <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Концентрація доходу</p><p className="font-bold text-lg">{data.factors.incomeConcentration}%</p></div>
            <div className="rounded-xl bg-gray-50 p-4 md:col-span-2"><p className="text-xs text-gray-500">Ріст витрат vs середнє 3 міс</p><p className="font-bold text-lg">{data.factors.expenseSpike}%</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Що зробити сьогодні</h2>
        <div className="space-y-3">
          {data.actionsToday.map((action, idx) => (
            <div key={`${idx}-${action}`} className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
              {idx + 1}. {action}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
