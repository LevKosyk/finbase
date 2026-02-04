"use client";

import { Input } from "@/components/ui/Input";
import { Search, Filter, X, Calendar, DollarSign, ListFilter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/ui/Button";

export default function IncomeFilters() {
    const searchParams = useSearchParams();
    const { replace } = useRouter();
    
    // Initial search value from URL
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    
    // Modal State
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Filter States
    const [type, setType] = useState(searchParams.get('type') || 'all');
    const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
    const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
    const [minAmount, setMinAmount] = useState(searchParams.get('minAmount') || '');
    const [maxAmount, setMaxAmount] = useState(searchParams.get('maxAmount') || '');

    const handleSearch = useDebouncedCallback((term) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('q', term);
        } else {
            params.delete('q');
        }
        replace(`?${params.toString()}`);
    }, 300);

    const applyFilters = () => {
        const params = new URLSearchParams(searchParams);
        
        // Type
        if (type && type !== 'all') params.set('type', type);
        else params.delete('type');

        // Date
        if (startDate) params.set('startDate', startDate);
        else params.delete('startDate');
        
        if (endDate) params.set('endDate', endDate);
        else params.delete('endDate');

        // Amount
        if (minAmount) params.set('minAmount', minAmount);
        else params.delete('minAmount');

        if (maxAmount) params.set('maxAmount', maxAmount);
        else params.delete('maxAmount');

        replace(`?${params.toString()}`);
        setIsFilterOpen(false);
    };

    const clearFilters = () => {
        setType('all');
        setStartDate('');
        setEndDate('');
        setMinAmount('');
        setMaxAmount('');
        
        const params = new URLSearchParams(searchParams);
        params.delete('type');
        params.delete('startDate');
        params.delete('endDate');
        params.delete('minAmount');
        params.delete('maxAmount');
        replace(`?${params.toString()}`);
        setIsFilterOpen(false);
    }
    
    const activeFiltersCount = [
        type !== 'all', 
        startDate, 
        endDate, 
        minAmount, 
        maxAmount
    ].filter(Boolean).length;

    return (
        <>
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
                    <button 
                        onClick={() => setIsFilterOpen(true)}
                        className={`px-4 py-3 border rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                            activeFiltersCount > 0 
                                ? 'bg-[var(--fin-primary)] text-white border-[var(--fin-primary)] shadow-md shadow-blue-500/20' 
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        <Filter className="w-4 h-4" />
                        Фільтри
                        {activeFiltersCount > 0 && (
                            <span className="bg-white text-[var(--fin-primary)] text-xs rounded-full w-5 h-5 flex items-center justify-center font-extrabold">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Filter Modal */}
            {isFilterOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsFilterOpen(false)} />
                    
                    <div className="relative bg-white rounded-[2rem] w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6 md:p-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                                <ListFilter className="w-6 h-6 text-[var(--fin-primary)]" />
                                Фільтри
                            </h2>
                            <button onClick={() => setIsFilterOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Type Filter */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <ListFilter className="w-4 h-4 text-gray-400" /> Тип доходу
                                </label>
                                <select 
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full p-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-[var(--fin-primary)] rounded-xl outline-none transition-all font-medium appearance-none cursor-pointer"
                                >
                                    <option value="all">Всі типи</option>
                                    <option value="job">Послуги</option>
                                    <option value="product">Продаж</option>
                                    <option value="consulting">Консультація</option>
                                </select>
                            </div>

                            {/* Date Range */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" /> Період
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <span className="text-xs text-gray-400 font-medium ml-1">З</span>
                                        <input 
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full p-3 bg-gray-50 border border-gray-100 focus:bg-white focus:border-[var(--fin-primary)] rounded-xl outline-none transition-all font-medium text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs text-gray-400 font-medium ml-1">До</span>
                                        <input 
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full p-3 bg-gray-50 border border-gray-100 focus:bg-white focus:border-[var(--fin-primary)] rounded-xl outline-none transition-all font-medium text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Amount Range */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-gray-400" /> Сума (₴)
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            placeholder="Від"
                                            value={minAmount}
                                            onChange={(e) => setMinAmount(e.target.value)}
                                            className="w-full p-3 pl-8 bg-gray-50 border border-gray-100 focus:bg-white focus:border-[var(--fin-primary)] rounded-xl outline-none transition-all font-medium text-sm placeholder:text-gray-400"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₴</span>
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            placeholder="До"
                                            value={maxAmount}
                                            onChange={(e) => setMaxAmount(e.target.value)}
                                            className="w-full p-3 pl-8 bg-gray-50 border border-gray-100 focus:bg-white focus:border-[var(--fin-primary)] rounded-xl outline-none transition-all font-medium text-sm placeholder:text-gray-400"
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₴</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button 
                                    onClick={clearFilters}
                                    variant="secondary"
                                    className="flex-1"
                                >
                                    Очистити
                                </Button>
                                <Button 
                                    onClick={applyFilters}
                                    className="flex-[2] py-4 rounded-xl"
                                >
                                    Застосувати
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
