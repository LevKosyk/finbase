"use client";

import { Input } from "@/components/ui/Input";
import { Search, Filter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export default function IncomeFilters() {
    const searchParams = useSearchParams();
    const { replace } = useRouter();
    
    // Initial search value from URL
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

    const handleSearch = useDebouncedCallback((term) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('q', term);
        } else {
            params.delete('q');
        }
        replace(`?${params.toString()}`);
    }, 300);

    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Пошук за джерелом або типом..."
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--fin-primary)]/20 focus:border-[var(--fin-primary)] transition-all font-medium placeholder:text-gray-400"
                    defaultValue={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        handleSearch(e.target.value);
                    }}
                />
            </div>
            
            <div className="flex gap-2">
                 {/* Placeholder for Source Filter Dropdown if needed */}
                 <button className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-600 font-bold text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors">
                    <Filter className="w-4 h-4" />
                    Фільтри
                 </button>
            </div>
        </div>
    );
}
