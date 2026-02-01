"use client";

import { useState } from "react";
import { Plus, Filter, Search, ArrowUpRight, ArrowDownLeft, MoreHorizontal, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface IncomeListProps {
  initialIncomes: any[]; // Replace any with proper type
}

export default function IncomeList({ initialIncomes }: IncomeListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter logic can be improved, for now client-side filtering
  const filteredIncomes = initialIncomes.filter(income => 
    income.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (income.type && income.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-sm">
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="relative flex-1 max-w-lg">
                <Input 
                    type="text" 
                    placeholder="Пошук операцій..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="w-5 h-5 text-gray-400" />}
                    className="border-none focus:bg-white"
                />
            </div>
            <div className="flex gap-2 shrink-0">
                <Button 
                    variant="secondary"
                    size="sm"
                    className="bg-gray-50 border-transparent hover:border-gray-200 text-gray-700 font-bold h-auto py-3.5"
                    leftIcon={<Calendar className="w-4 h-4" />}
                >
                    Лютий 2026
                </Button>
                <Button 
                    variant="secondary"
                    size="sm"
                    className="bg-gray-50 border-transparent hover:border-gray-200 text-gray-700 font-bold h-auto py-3.5"
                    leftIcon={<Filter className="w-4 h-4" />}
                >
                    Фільтри
                </Button>
            </div>
        </div>

        {/* Transactions List - Modern Row Style */}
        <div className="space-y-3">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <div className="col-span-5">Джерело / Категорія</div>
                <div className="col-span-3">Дата</div>
                <div className="col-span-2">Статус</div>
                <div className="col-span-2 text-right">Сума</div>
            </div>

            {filteredIncomes.map((tx) => (
                <div key={tx.id} className="group relative bg-white border border-gray-100 rounded-3xl p-4 hover:border-[var(--fin-primary)]/30 hover:shadow-lg hover:shadow-[var(--fin-primary)]/5 transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    
                    {/* Source & Icon */}
                    <div className="md:col-span-5 flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm`}>
                            <ArrowDownLeft className="w-6 h-6 rotate-45" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-base">{tx.source}</h4>
                            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-500 text-xs font-semibold">
                                {tx.type === 'service' ? 'Послуги' : tx.type === 'consulting' ? 'Консультація' : tx.type}
                            </span>
                        </div>
                    </div>

                    {/* Date */}
                    <div className="md:col-span-3 text-sm text-gray-500 font-medium pl-14 md:pl-0">
                        {new Date(tx.date).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>

                    {/* Status */}
                    <div className="md:col-span-2 pl-14 md:pl-0">
                         <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            tx.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${tx.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                            {tx.status === 'completed' ? 'Зараховано' : 'В обробці'}
                        </span>
                    </div>

                    {/* Amount & Action */}
                    <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-4 pl-14 md:pl-0">
                        <span className="font-extrabold text-gray-900 text-lg">
                            +{tx.amount.toLocaleString()} ₴
                        </span>
                        <Button 
                            variant="ghost" 
                            className="p-2 h-auto text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-xl opacity-0 group-hover:opacity-100"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>

        <div className="mt-8 flex justify-center">
            <Button 
                variant="ghost" 
                className="text-sm font-bold text-gray-500 hover:text-[var(--fin-primary)] hover:bg-gray-50 h-auto py-2 px-6"
            >
                Завантажити ще
            </Button>
        </div>
      </div>
  );
}
