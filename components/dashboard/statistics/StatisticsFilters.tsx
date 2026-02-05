"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Download, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";

export default function StatisticsFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const period = searchParams.get('period') || 'year';
    
    // State for custom dates to allow typing without immediate URL updates
    const [fromDate, setFromDate] = useState(searchParams.get('from') || '');
    const [toDate, setToDate] = useState(searchParams.get('to') || '');

    useEffect(() => {
        // Sync local state if URL params change externally (e.g. back button)
        setFromDate(searchParams.get('from') || '');
        setToDate(searchParams.get('to') || '');
    }, [searchParams]);

    const handlePeriodChange = (p: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('period', p);
        if (p !== 'custom') {
            params.delete('from');
            params.delete('to');
        }
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    const handleDateChange = (type: 'from' | 'to', value: string) => {
        if (type === 'from') setFromDate(value);
        else setToDate(value);

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
        <div className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur-md py-4 mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 transition-all duration-300">
            <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                <div className="bg-white p-1.5 rounded-2xl border border-gray-200/50 shadow-sm flex items-center gap-1 overflow-x-auto">
                    {(['month', 'quarter', 'year', 'custom'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => handlePeriodChange(p)}
                            className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                                period === p
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            {p === 'month' ? 'Місяць' : p === 'quarter' ? 'Квартал' : p === 'year' ? 'Рік' : 'Довільний'}
                        </button>
                    ))}
                </div>

                {period === 'custom' && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-300 bg-white p-1.5 rounded-2xl border border-gray-200/50 shadow-sm">
                        <div className="relative">
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => handleDateChange('from', e.target.value)}
                                className="pl-3 pr-2 py-2 rounded-xl bg-gray-50 border-none text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-[var(--fin-primary)]/20"
                            />
                        </div>
                        <span className="text-gray-400 font-medium">-</span>
                        <div className="relative">
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => handleDateChange('to', e.target.value)}
                                className="pl-3 pr-2 py-2 rounded-xl bg-gray-50 border-none text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-[var(--fin-primary)]/20"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                 <Button variant="ghost" className="h-11 px-6 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm shadow-sm" leftIcon={<Download className="w-4 h-4" />}>
                    Експорт (PDF)
                 </Button>
            </div>
        </div>
    );
}
