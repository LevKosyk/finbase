"use client";

import { Search, Filter, X, Calendar, DollarSign, ListFilter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/ui/Button";
import { getExpenseCategories } from "@/app/actions/expenses";
import { useDashboardStore } from "@/lib/store/dashboard-store";

export default function ExpenseFilters() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const filters = useDashboardStore((state) => state.expenseFilters);
  const setFilters = useDashboardStore((state) => state.setExpenseFilters);
  const resetFilters = useDashboardStore((state) => state.resetExpenseFilters);
  const isFilterOpen = useDashboardStore((state) => state.expenseFiltersOpen);
  const setIsFilterOpen = useDashboardStore((state) => state.setExpenseFiltersOpen);
  const [categories, setCategories] = useState<string[]>(["all"]);

  useEffect(() => {
    setFilters({
      q: searchParams.get("q") || "",
      category: searchParams.get("category") || "all",
      startDate: searchParams.get("startDate") || "",
      endDate: searchParams.get("endDate") || "",
      minAmount: searchParams.get("minAmount") || "",
      maxAmount: searchParams.get("maxAmount") || "",
    });
  }, [searchParams, setFilters]);

  useEffect(() => {
    async function loadCategories() {
      const list = await getExpenseCategories();
      setCategories(["all", ...list]);
    }
    loadCategories();
  }, []);

  const handleSearch = useDebouncedCallback((term) => {
    const params = new URLSearchParams(searchParams);
    if (term) params.set("q", term);
    else params.delete("q");
    replace(`?${params.toString()}`, { scroll: false });
  }, 300);

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams);
    if (filters.category && filters.category !== "all") params.set("category", filters.category);
    else params.delete("category");

    if (filters.startDate) params.set("startDate", filters.startDate);
    else params.delete("startDate");

    if (filters.endDate) params.set("endDate", filters.endDate);
    else params.delete("endDate");

    if (filters.minAmount) params.set("minAmount", filters.minAmount);
    else params.delete("minAmount");

    if (filters.maxAmount) params.set("maxAmount", filters.maxAmount);
    else params.delete("maxAmount");

    replace(`?${params.toString()}`, { scroll: false });
    setIsFilterOpen(false);
  };

  const clearFilters = () => {
    resetFilters();

    const params = new URLSearchParams(searchParams);
    params.delete("q");
    params.delete("category");
    params.delete("startDate");
    params.delete("endDate");
    params.delete("minAmount");
    params.delete("maxAmount");
    replace(`?${params.toString()}`, { scroll: false });
    setIsFilterOpen(false);
  };

  const activeFiltersCount = [
    filters.category !== "all",
    filters.startDate,
    filters.endDate,
    filters.minAmount,
    filters.maxAmount
  ].filter(Boolean).length;

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Пошук за категорією або описом..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--fin-primary)]/20 focus:border-[var(--fin-primary)] transition-all font-medium placeholder:text-gray-400"
            value={filters.q}
            onChange={(e) => {
              setFilters({ q: e.target.value });
              handleSearch(e.target.value);
            }}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setIsFilterOpen(true)}
            variant={activeFiltersCount > 0 ? "primary" : "secondary"}
            size="md"
            className="min-w-[132px]"
          >
            <Filter className="w-4 h-4" />
            Фільтри
            {activeFiltersCount > 0 && (
              <span className="bg-white text-[var(--fin-primary)] text-xs rounded-full w-5 h-5 flex items-center justify-center font-extrabold">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>
      </div>

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
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <ListFilter className="w-4 h-4 text-gray-400" /> Категорія
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ category: e.target.value })}
                  className="w-full p-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-[var(--fin-primary)] rounded-xl outline-none transition-all font-medium appearance-none cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c === "all" ? "Всі категорії" : c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" /> Період
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400 font-medium ml-1">З</span>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ startDate: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-100 focus:bg-white focus:border-[var(--fin-primary)] rounded-xl outline-none transition-all font-medium text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-400 font-medium ml-1">До</span>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ endDate: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-100 focus:bg-white focus:border-[var(--fin-primary)] rounded-xl outline-none transition-all font-medium text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-400" /> Сума (₴)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="Від"
                      value={filters.minAmount}
                      onChange={(e) => setFilters({ minAmount: e.target.value })}
                      className="w-full p-3 pl-8 bg-gray-50 border border-gray-100 focus:bg-white focus:border-[var(--fin-primary)] rounded-xl outline-none transition-all font-medium text-sm placeholder:text-gray-400"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₴</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="До"
                      value={filters.maxAmount}
                      onChange={(e) => setFilters({ maxAmount: e.target.value })}
                      className="w-full p-3 pl-8 bg-gray-50 border border-gray-100 focus:bg-white focus:border-[var(--fin-primary)] rounded-xl outline-none transition-all font-medium text-sm placeholder:text-gray-400"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">₴</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button onClick={clearFilters} variant="secondary" className="flex-1">
                  Очистити
                </Button>
                <Button onClick={applyFilters} className="flex-[2] py-4 rounded-xl">
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
