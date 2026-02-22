"use client";

import dynamic from "next/dynamic";
import { memo } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SummaryCards from "@/components/dashboard/SummaryCards";
import TodayActions from "@/components/dashboard/TodayActions";
import type { DashboardStats } from "@/lib/types/dashboard";

/* ── Skeleton shared primitive ── */
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse ${className}`}
    />
  );
}

/* ── Lazy-loaded heavy widgets ── */
const FinancialChart = dynamic(
  () => import("@/components/dashboard/FinancialChart"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full min-h-70" />,
  },
);

const TaxStatusBlock = dynamic(
  () => import("@/components/dashboard/TaxStatusBlock"),
  { loading: () => <Skeleton className="h-full min-h-55" /> },
);

const AIWidget = dynamic(() => import("@/components/dashboard/AIWidget"), {
  loading: () => <Skeleton className="h-full min-h-45" />,
});

const RecentTransactions = dynamic(
  () => import("@/components/dashboard/RecentTransactions"),
  { loading: () => <Skeleton className="h-full min-h-65" /> },
);

/* ── FOP Health mini-block (inline) ── */
const HealthMini = memo(function HealthMini({
  health,
}: {
  health: { riskScore: number; factors: { limitUsage: number; dueSoonCount: number; overdueCount: number } };
}) {
  return (
    <section className="rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Здоров&apos;я ФОП
        </h3>
        <Link
          href="/dashboard/health"
          className="text-xs font-bold text-(--fin-primary) inline-flex items-center gap-1 hover:opacity-75 transition-opacity"
        >
          Деталі <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Ризик-скор", value: `${health.riskScore}/100` },
          { label: "Ліміт доходу", value: `${health.factors.limitUsage}%` },
          {
            label: "Термінові",
            value: String(health.factors.dueSoonCount + health.factors.overdueCount),
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3"
          >
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium leading-none">
              {item.label}
            </p>
            <p className="mt-1.5 text-lg font-extrabold text-gray-900 dark:text-gray-100 leading-none">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
});

/* ── Main component ── */

interface DashboardPersonalizedProps {
  stats: DashboardStats;
  health: {
    riskScore: number;
    factors: { limitUsage: number; dueSoonCount: number; overdueCount: number };
  } | null;
  firstName: string;
  reminders: { id: number; title: string; date: string; type: string; completed: boolean }[];
  recentTransactions: { id: string; amount: number; source: string; date: string; type: string }[];
}

export default function DashboardPersonalized({
  stats,
  health,
  firstName,
  reminders,
  recentTransactions,
}: DashboardPersonalizedProps) {
  return (
    <div className="max-w-350 mx-auto pb-10 space-y-5">
      {/* ── Row 1: Greeting + FOP status + CTAs ── */}
      <DashboardHeader
        firstName={firstName}
        fop={stats.fop}
        taxStatus={stats.tax.status}
      />

      {/* ── Row 2: KPI cards ── */}
      <SummaryCards stats={stats} />

      {/* ── Row 3: Health mini (conditional) + Chart + Today actions ── */}
      {health && <HealthMini health={health} />}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-8 min-h-75">
          <FinancialChart data={stats.income.history} />
        </div>
        <div className="xl:col-span-4 min-h-75">
          <TodayActions reminders={reminders} />
        </div>
      </div>

      {/* ── Row 4: Recent txn + Tax block + AI ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5">
        <div className="xl:col-span-5">
          <RecentTransactions initialData={recentTransactions} />
        </div>
        <div className="xl:col-span-4">
          <TaxStatusBlock stats={stats} />
        </div>
        <div className="xl:col-span-3">
          <AIWidget />
        </div>
      </div>
    </div>
  );
}
