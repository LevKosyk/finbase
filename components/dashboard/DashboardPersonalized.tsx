"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowUpRight, FileText, Landmark, Plus, Move } from "lucide-react";
import dynamic from "next/dynamic";
import { saveDashboardPreference } from "@/app/actions/dashboard-preferences";

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

type WidgetId = "summary" | "chart" | "health" | "tax" | "premium" | "ai";

const ALL_WIDGETS: WidgetId[] = ["summary", "chart", "health", "tax", "premium", "ai"];

export default function DashboardPersonalized({
  stats,
  health,
  firstName,
  initialLayout,
  initialDensity,
}: {
  stats: any;
  health: any;
  firstName: string;
  initialLayout: string[];
  initialDensity: "compact" | "comfortable";
}) {
  const [layout, setLayout] = useState<WidgetId[]>(
    (initialLayout.filter((item) => ALL_WIDGETS.includes(item as WidgetId)) as WidgetId[]) || ALL_WIDGETS
  );
  const [density, setDensity] = useState<"compact" | "comfortable">(initialDensity);
  const [dragging, setDragging] = useState<WidgetId | null>(null);
  const [isEditLayout, setIsEditLayout] = useState(false);
  const [pending, startTransition] = useTransition();

  const gapClass = density === "compact" ? "space-y-3 gap-3" : "space-y-5 gap-5";

  const rightColumn = useMemo(
    () => layout.filter((id) => id === "tax" || id === "premium" || id === "ai"),
    [layout]
  );
  const leftColumn = useMemo(
    () => layout.filter((id) => id !== "tax" && id !== "premium" && id !== "ai"),
    [layout]
  );

  const persist = (nextLayout: WidgetId[], nextDensity = density) => {
    startTransition(async () => {
      await saveDashboardPreference({ layout: nextLayout, density: nextDensity });
    });
  };

  const moveBefore = (target: WidgetId) => {
    if (!isEditLayout) return;
    if (!dragging || dragging === target) return;
    const without = layout.filter((item) => item !== dragging);
    const idx = without.indexOf(target);
    const next = [...without.slice(0, idx), dragging, ...without.slice(idx)];
    setLayout(next);
    setDragging(null);
    persist(next);
  };

  const renderWidget = (id: WidgetId) => {
    if (id === "summary") return <SummaryCards stats={stats} />;
    if (id === "chart") return <FinancialChart data={stats.income.history} />;
    if (id === "health") {
      if (!health) return null;
      return (
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
        </div>
      );
    }
    if (id === "tax") return <TaxStatusBlock stats={stats} />;
    if (id === "premium") return <PremiumBlock />;
    if (id === "ai") return <AIWidget />;
    return null;
  };

  return (
    <div className={`pb-12 max-w-7xl mx-auto ${gapClass} animate-in fade-in duration-500`}>
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

      <div className="flex items-center gap-2">
        <button
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${isEditLayout ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}
          onClick={() => {
            setIsEditLayout((prev) => !prev);
            setDragging(null);
          }}
        >
          {isEditLayout ? "Готово" : "Редагувати лейаут"}
        </button>
        <button
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${density === "compact" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
          onClick={() => {
            setDensity("compact");
            persist(layout, "compact");
          }}
        >
          Compact
        </button>
        <button
          className={`px-3 py-1.5 rounded-lg text-xs font-bold ${density === "comfortable" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
          onClick={() => {
            setDensity("comfortable");
            persist(layout, "comfortable");
          }}
        >
          Comfortable
        </button>
        {isEditLayout && <span className="text-xs text-gray-500 dark:text-gray-400">Перетягніть блок за іконку переміщення</span>}
        {pending && <span className="text-xs text-gray-400">Збереження...</span>}
      </div>

      <div className={`grid grid-cols-1 xl:grid-cols-3 ${density === "compact" ? "gap-3" : "gap-5"}`}>
        <div className={`xl:col-span-2 flex flex-col ${density === "compact" ? "gap-3" : "gap-5"}`}>
          {leftColumn.map((id) => (
            <div
              key={id}
              draggable={isEditLayout}
              onDragStart={() => isEditLayout && setDragging(id)}
              onDragOver={(e) => isEditLayout && e.preventDefault()}
              onDrop={() => moveBefore(id)}
              className="relative"
            >
              {isEditLayout && (
                <span className="absolute -left-2 -top-2 z-10 rounded-md bg-white/90 border border-gray-200 p-1 text-gray-400 dark:bg-gray-900/90 dark:border-gray-700">
                  <Move className="w-3.5 h-3.5" />
                </span>
              )}
              {renderWidget(id)}
            </div>
          ))}
        </div>
        <div className={`flex flex-col ${density === "compact" ? "gap-3" : "gap-5"}`}>
          {rightColumn.map((id) => (
            <div
              key={id}
              draggable={isEditLayout}
              onDragStart={() => isEditLayout && setDragging(id)}
              onDragOver={(e) => isEditLayout && e.preventDefault()}
              onDrop={() => moveBefore(id)}
              className="relative"
            >
              {isEditLayout && (
                <span className="absolute -left-2 -top-2 z-10 rounded-md bg-white/90 border border-gray-200 p-1 text-gray-400 dark:bg-gray-900/90 dark:border-gray-700">
                  <Move className="w-3.5 h-3.5" />
                </span>
              )}
              {renderWidget(id)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
