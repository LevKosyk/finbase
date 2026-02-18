"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PageShell from "@/components/dashboard/shared/PageShell";

const SummaryCards = dynamic(() => import("@/components/dashboard/SummaryCards"), {
  loading: () => <div className="h-[168px] rounded-[2rem] border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 animate-pulse" />,
});
const FinancialChart = dynamic(() => import("@/components/dashboard/FinancialChart"), {
  loading: () => <div className="h-[380px] rounded-[2rem] border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 animate-pulse" />,
});
const AIWidget = dynamic(() => import("@/components/dashboard/AIWidget"), {
  loading: () => <div className="h-[240px] rounded-[2rem] border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 animate-pulse" />,
});
const TaxStatusBlock = dynamic(() => import("@/components/dashboard/TaxStatusBlock"), {
  loading: () => <div className="h-[220px] rounded-[2rem] border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 animate-pulse" />,
});
const PremiumBlock = dynamic(() => import("@/components/dashboard/PremiumBlock"), {
  loading: () => <div className="h-[220px] rounded-[2rem] border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 animate-pulse" />,
});

export default function DashboardPersonalized({
  stats,
  health,
  firstName,
}: {
  stats: any;
  health: any;
  firstName: string;
}) {
  return (
    <PageShell
      title={`Вітаємо, ${firstName}`}
      description="Операційна картина вашого ФОП: ключові показники, податки, ризики та дії на сьогодні."
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 xl:h-[calc(100vh-270px)]">
        <div className="xl:col-span-8 flex flex-col gap-4 xl:min-h-0">
          <SummaryCards stats={stats} />
          {health && (
            <section className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">Здоров&apos;я ФОП</h2>
                <Link href="/dashboard/health" className="text-xs font-bold text-[var(--fin-primary)] inline-flex items-center gap-1">
                  Деталі <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Ризик-скор</p>
                  <p className="mt-1 text-lg font-extrabold text-gray-900 dark:text-gray-100">{health.riskScore}/100</p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Ліміт доходу</p>
                  <p className="mt-1 text-lg font-extrabold text-gray-900 dark:text-gray-100">{health.factors.limitUsage}%</p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Термінові/прострочені</p>
                  <p className="mt-1 text-lg font-extrabold text-gray-900 dark:text-gray-100">
                    {health.factors.dueSoonCount + health.factors.overdueCount}
                  </p>
                </div>
              </div>
            </section>
          )}
          <div className="xl:flex-1 xl:min-h-0">
            <FinancialChart data={stats.income.history} />
          </div>
        </div>

        <div className="xl:col-span-4 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-1 gap-4 xl:h-full">
          <div className="xl:min-h-0">
            <TaxStatusBlock stats={stats} />
          </div>
          <div className="xl:min-h-0">
            <PremiumBlock />
          </div>
          <div className="xl:min-h-0">
            <AIWidget />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
