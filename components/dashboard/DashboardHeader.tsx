"use client";

import Link from "next/link";
import { Plus, BarChart2, CheckCircle2, AlertOctagon, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { DashboardStats } from "@/lib/types/dashboard";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Доброго ранку";
  if (h < 17) return "Добрий день";
  return "Добрий вечір";
};

const taxStatusConfig = {
  ok: {
    label: "Порядок",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    Icon: CheckCircle2,
  },
  warning: {
    label: "Перевірте дедлайн",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    Icon: AlertOctagon,
  },
  danger: {
    label: "Є прострочені",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    Icon: AlertTriangle,
  },
} as const;

interface DashboardHeaderProps {
  firstName: string;
  fop: DashboardStats["fop"];
  taxStatus: DashboardStats["tax"]["status"];
}

export default function DashboardHeader({
  firstName,
  fop,
  taxStatus,
}: DashboardHeaderProps) {
  const greeting = getGreeting();
  const { label, color, Icon } = taxStatusConfig[taxStatus];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 rounded-2xl px-6 py-5 border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Left: identity */}
      <div className="flex flex-col gap-1">
        <p className="text-[13px] font-semibold text-gray-400 dark:text-gray-500 leading-none">
          {greeting}
        </p>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
          {firstName}{" "}
          <span
            className="not-italic"
            role="img"
            aria-label="wave"
          >
            👋
          </span>
        </h1>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {/* FOP badge */}
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 leading-none">
            ФОП {fop.group} гр.&nbsp;·&nbsp;{fop.taxSystem}
          </span>
          {/* Tax status badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold leading-none ${color}`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            {label}
          </span>
        </div>
      </div>

      {/* Right: CTAs */}
      <div className="flex items-center gap-2.5 shrink-0">
        <Link href="/dashboard/income">
          <Button
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Дохід
          </Button>
        </Link>
        <Link href="/dashboard/statistics">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<BarChart2 className="w-3.5 h-3.5" />}
          >
            Аналітика
          </Button>
        </Link>
      </div>
    </div>
  );
}
