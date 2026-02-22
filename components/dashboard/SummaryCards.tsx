"use client";

import {
  TrendingDown,
  TrendingUp,
  Wallet,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import type { DashboardStats } from "@/lib/types/dashboard";

interface SummaryCardsProps {
  stats: DashboardStats;
}

function ChangeBadge({ change }: { change: number }) {
  if (change === 0)
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        <Minus className="w-3 h-3" />
        0%
      </span>
    );
  const positive = change > 0;
  return (
    <span
      className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${
        positive
          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
          : "bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400"
      }`}
    >
      {positive ? (
        <ArrowUpRight className="w-3 h-3" />
      ) : (
        <ArrowDownRight className="w-3 h-3" />
      )}
      {Math.abs(change)}%
    </span>
  );
}

export default function SummaryCards({ stats }: SummaryCardsProps) {
  const { income, expenses, tax, limit } = stats;

  const net = income.total - expenses.total;
  const netPositive = net >= 0;

  const fmt = (v: number) => v.toLocaleString("uk-UA") + "\u00a0₴";

  const cards = [
    {
      label: "Дохід за рік",
      value: fmt(income.total),
      change: income.change,
      Icon: Wallet,
      accent:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
      subtext: null as string | null,
      subtextColor: "",
      showBar: false,
      barPercent: 0,
    },
    {
      label: "Витрати",
      value: fmt(expenses.total),
      change: expenses.change,
      Icon: CreditCard,
      accent:
        "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
      subtext: null as string | null,
      subtextColor: "",
      showBar: false,
      barPercent: 0,
    },
    {
      label: "Чистий прибуток",
      value: fmt(Math.abs(net)),
      change: undefined as number | undefined,
      Icon: netPositive ? TrendingUp : TrendingDown,
      accent: netPositive
        ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
        : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
      subtext: netPositive ? "↑ прибуток" : "↓ збиток",
      subtextColor: netPositive
        ? "text-indigo-500 dark:text-indigo-400"
        : "text-red-500 dark:text-red-400",
      showBar: false,
      barPercent: 0,
    },
    {
      label: "Податок до сплати",
      value: fmt(tax.amount),
      change: undefined as number | undefined,
      Icon: AlertTriangle,
      accent:
        "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
      subtext: tax.nextPaymentDate
        ? `до ${tax.nextPaymentDate}`
        : "Вкажіть налаштування",
      subtextColor: "text-orange-500 dark:text-orange-400",
      showBar: false,
      barPercent: 0,
    },
    {
      label: "Ліміт ФОП",
      value: limit.max > 0 ? `${limit.percent.toFixed(1)}%` : "—",
      change: undefined as number | undefined,
      Icon: AlertTriangle,
      accent:
        limit.percent >= 90
          ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          : limit.percent >= 70
          ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          : "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
      subtext:
        limit.max > 0
          ? `${fmt(limit.current)} з ${fmt(limit.max)}`
          : "Ліміт не задано",
      subtextColor: "text-gray-400 dark:text-gray-500",
      showBar: limit.max > 0,
      barPercent: Math.min(100, limit.percent),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow duration-200"
        >
          {/* Icon + badge row */}
          <div className="flex items-center justify-between">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${card.accent}`}
            >
              <card.Icon style={{ width: 18, height: 18 }} />
            </div>
            {card.change !== undefined && (
              <ChangeBadge change={card.change} />
            )}
          </div>

          {/* Label + Value */}
          <div>
            <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 leading-none">
              {card.label}
            </p>
            <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight leading-none">
              {card.value}
            </p>
          </div>

          {/* Subtext / progress bar */}
          {card.showBar ? (
            <div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    card.barPercent >= 90
                      ? "bg-red-500"
                      : card.barPercent >= 70
                      ? "bg-amber-500"
                      : "bg-teal-500"
                  }`}
                  style={{ width: `${card.barPercent}%` }}
                />
              </div>
              <p className={`text-[11px] font-medium mt-1 ${card.subtextColor}`}>
                {card.subtext}
              </p>
            </div>
          ) : card.subtext ? (
            <p className={`text-[11px] font-medium ${card.subtextColor}`}>
              {card.subtext}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
