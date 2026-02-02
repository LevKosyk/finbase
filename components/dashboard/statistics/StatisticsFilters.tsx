"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";

export default function StatisticsFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const period = searchParams.get('period') || 'year';

    const handlePeriodChange = (p: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('period', p);
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur-md py-4 mb-6 flex flex-col md:flex-row justify-between items-center gap-4 transition-all duration-300">
            <div className="bg-white p-1.5 rounded-2xl border border-gray-200/50 shadow-sm flex items-center gap-1">
                {(['month', 'quarter', 'year'] as const).map((p) => (
                    <button
                        key={p}
                        onClick={() => handlePeriodChange(p)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                            period === p
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                    >
                        {p === 'month' ? 'Місяць' : p === 'quarter' ? 'Квартал' : 'Рік'}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3">
                 <Button variant="ghost" className="h-11 px-6 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold text-sm shadow-sm" leftIcon={<Download className="w-4 h-4" />}>
                    Експорт (PDF)
                 </Button>
            </div>
        </div>
    );
}
