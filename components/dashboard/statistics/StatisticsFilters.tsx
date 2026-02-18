"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useDashboardStore } from "@/lib/store/dashboard-store";
import ExportFormatModalButton from "@/components/dashboard/shared/ExportFormatModalButton";

export default function StatisticsFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const filters = useDashboardStore((state) => state.statisticsFilters);
    const setFilters = useDashboardStore((state) => state.setStatisticsFilters);

    useEffect(() => {
        const period = (searchParams.get("period") as "month" | "quarter" | "year" | "custom") || "year";
        setFilters({
          period,
          from: searchParams.get("from") || "",
          to: searchParams.get("to") || "",
        });
    }, [searchParams, setFilters]);

    const handlePeriodChange = (p: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('period', p);
        setFilters({ period: p as "month" | "quarter" | "year" | "custom" });
        if (p !== 'custom') {
            params.delete('from');
            params.delete('to');
            setFilters({ from: "", to: "" });
        }
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    const handleDateChange = (type: 'from' | 'to', value: string) => {
        if (type === 'from') setFilters({ from: value });
        else setFilters({ to: value });

        // Update URL only if we have valid dates or logic requires it
        // For better UX, we could debounce this or wait for blur, 
        // but for now let's update if both are present or just the one changed?
        // Let's defer URL update slightly or just update on change.
        const params = new URLSearchParams(searchParams);
        if (type === 'from') params.set('from', value);
        else params.set('to', value);
        
        // Only trigger router if both dates are set or at least we are in custom mode
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="py-1 mb-2 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 transition-all duration-300">
            <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                <div className="bg-white p-1.5 rounded-2xl border border-gray-200/50 shadow-sm flex items-center gap-1 overflow-x-auto">
                    {(['month', 'quarter', 'year', 'custom'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => handlePeriodChange(p)}
                            className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                                filters.period === p
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            {p === 'month' ? 'Місяць' : p === 'quarter' ? 'Квартал' : p === 'year' ? 'Рік' : 'Довільний'}
                        </button>
                    ))}
                </div>

                {filters.period === 'custom' && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-300 bg-white p-1.5 rounded-2xl border border-gray-200/50 shadow-sm">
                        <div className="relative">
                            <input
                                type="date"
                                value={filters.from}
                                onChange={(e) => handleDateChange('from', e.target.value)}
                                className="pl-3 pr-2 py-2 rounded-xl bg-gray-50 border-none text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-[var(--fin-primary)]/20"
                            />
                        </div>
                        <span className="text-gray-400 font-medium">-</span>
                        <div className="relative">
                            <input
                                type="date"
                                value={filters.to}
                                onChange={(e) => handleDateChange('to', e.target.value)}
                                className="pl-3 pr-2 py-2 rounded-xl bg-gray-50 border-none text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-[var(--fin-primary)]/20"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <ExportFormatModalButton
                  type="statistics"
                  label="Експорт"
                  defaultFormat="pdf"
                  formats={["pdf", "xlsx", "csv", "json"]}
                  extraParams={{
                    period: filters.period,
                    from: filters.period === "custom" ? filters.from : undefined,
                    to: filters.period === "custom" ? filters.to : undefined,
                  }}
                />
            </div>
        </div>
    );
}
