import { getDashboardStats } from "@/app/actions/dashboard";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getUser } from "@/app/actions/auth";
import { getHealthDashboard } from "@/app/actions/health";
import { ArrowUpRight, FileText, Landmark, Plus } from "lucide-react";

const SummaryCards = dynamic(() => import("@/components/dashboard/SummaryCards"));
const FinancialChart = dynamic(() => import("@/components/dashboard/FinancialChart"));
const AIWidget = dynamic(() => import("@/components/dashboard/AIWidget"));
const TaxStatusBlock = dynamic(() => import("@/components/dashboard/TaxStatusBlock"));
const PremiumBlock = dynamic(() => import("@/components/dashboard/PremiumBlock"));

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const user = await getUser();
  const health = await getHealthDashboard();

  if (!stats) return <div className="text-gray-500 dark:text-gray-400">Loading...</div>;

  const firstName = user?.firstName || user?.name || "User";

  return (
    <div className="min-h-[calc(100vh-110px)] animate-in fade-in duration-500">
      <div className="rounded-[2.2rem] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 md:p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Вітаємо, {firstName} 👋</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Ось ваша фінансова картина на сьогодні.</p>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <Link href="/dashboard/income" className="inline-flex">
              <span className="inline-flex items-center gap-2 h-11 px-4 rounded-xl bg-[var(--fin-primary)] text-white font-semibold text-sm">
                <Plus className="w-4 h-4" /> Додати дохід
              </span>
            </Link>
            <Link href="/dashboard/documents" className="inline-flex">
              <span className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold text-sm">
                <FileText className="w-4 h-4" /> Документи
              </span>
            </Link>
            <Link href="/dashboard/bank" className="inline-flex">
              <span className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold text-sm">
                <Landmark className="w-4 h-4" /> Виписка
              </span>
            </Link>
          </div>
        </div>

        <SummaryCards stats={stats} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 flex flex-col gap-5">
            <div>
              <FinancialChart data={stats.income.history} />
            </div>

            {health && (
              <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Здоров&apos;я ФОП</h2>
                  <Link href="/dashboard/health" className="text-sm font-bold text-[var(--fin-primary)] inline-flex items-center gap-1">
                    Деталі <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ризик-скор</p>
                    <p className="font-extrabold text-2xl text-gray-900 dark:text-gray-100">{health.riskScore}/100</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ліміт доходу</p>
                    <p className="font-bold text-base text-gray-900 dark:text-gray-100">{health.factors.limitUsage}%</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Термінові/прострочені</p>
                    <p className="font-bold text-base text-gray-900 dark:text-gray-100">{health.factors.dueSoonCount + health.factors.overdueCount}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {health.actionsToday.slice(0, 2).map((action, i) => (
                    <div key={`${i}-${action}`} className="rounded-xl border border-blue-100 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 text-sm font-medium text-blue-900 dark:text-blue-200">
                      {i + 1}. {action}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <div className="min-h-[190px]">
              <TaxStatusBlock stats={stats} />
            </div>
            <div className="min-h-[245px]">
              <PremiumBlock />
            </div>
            <div className="min-h-[180px]">
              <AIWidget />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
