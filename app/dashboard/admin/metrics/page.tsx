import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/rbac";
import { getBusinessMetrics } from "@/app/actions/admin-metrics";

function StatCard({ title, value, hint }: { title: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
      <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
      {hint ? <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{hint}</p> : null}
    </div>
  );
}

export default async function AdminMetricsPage() {
  const auth = await requireAdmin();
  if (!auth.ok) redirect("/dashboard");

  const m = await getBusinessMetrics();
  if (!m) redirect("/dashboard");

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Бізнес-метрики</h1>
        <p className="text-gray-600 dark:text-gray-300">Activation, retention, conversion, churn.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Користувачі (усього)" value={m.users.total} />
        <StatCard title="Нові за 30 днів" value={m.users.newLast30} />
        <StatCard title="Activation rate" value={`${m.activation.rate}%`} hint={`${m.activation.activated}/${m.activation.cohortSize}`} />
        <StatCard title="Free → Pro" value={`${m.conversion.freeToProRate}%`} hint={`${m.conversion.paid} з ${m.conversion.free + m.conversion.paid}`} />
        <StatCard title="D1 retention" value={`${m.retention.d1}%`} hint={`cohort: ${m.retention.d1Cohort}`} />
        <StatCard title="D7 retention" value={`${m.retention.d7}%`} hint={`cohort: ${m.retention.d7Cohort}`} />
        <StatCard title="Churn (Pro, 30d)" value={`${m.churn.rate}%`} hint={`${m.churn.churnedProLast30}/${m.churn.activePro}`} />
      </div>
    </div>
  );
}
