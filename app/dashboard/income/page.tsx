"use client";

import { useState } from "react";
import { Plus, Filter, Search, ArrowUpRight, MoreHorizontal, Download, Calendar, ArrowDownLeft } from "lucide-react";

const transactions = [
  { id: 1, source: "Розробка сайту", date: "01 Лют 2026", amount: 3000, type: "service", status: "completed", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  { id: 2, source: "Консультація", date: "28 Січ 2026", amount: 5000, type: "consulting", status: "completed", iconBg: "bg-purple-100", iconColor: "text-purple-600" },
  { id: 3, source: "Підтримка", date: "25 Січ 2026", amount: 1500, type: "service", status: "pending", iconBg: "bg-orange-100", iconColor: "text-orange-600" },
  { id: 4, source: "Дизайн лого", date: "20 Січ 2026", amount: 2000, type: "design", status: "completed", iconBg: "bg-pink-100", iconColor: "text-pink-600" },
  { id: 5, source: "Аудит коду", date: "15 Січ 2026", amount: 4500, type: "consulting", status: "completed", iconBg: "bg-teal-100", iconColor: "text-teal-600" },
  { id: 6, source: "Менторство", date: "12 Січ 2026", amount: 1200, type: "consulting", status: "completed", iconBg: "bg-indigo-100", iconColor: "text-indigo-600" },
];

export default function IncomePage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="pb-12 max-w-6xl mx-auto">
      {/* Header with improved layout */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
           <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Облік доходів</h1>
           <p className="text-gray-500 text-lg">Всі ваші фінансові надходження під контролем</p>
        </div>
        <div className="flex gap-3">
            <button className="flex items-center gap-2 bg-white text-gray-700 px-5 py-3 rounded-2xl font-bold border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">Експорт</span>
            </button>
            <button className="flex items-center gap-2 bg-[var(--fin-primary)] text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5">
                <Plus className="w-5 h-5" />
                Додати дохід
            </button>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-green-100 transition-colors"></div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1">Цей місяць</p>
            <h3 className="text-3xl font-extrabold text-gray-900">14 200 ₴</h3>
            <div className="flex items-center gap-1 mt-2 text-green-600 text-sm font-bold">
                <ArrowUpRight className="w-4 h-4" />
                +12% <span className="text-gray-400 font-medium ml-1">від минулого</span>
            </div>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-blue-100 transition-colors"></div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1">Середній чек</p>
            <h3 className="text-3xl font-extrabold text-gray-900">2 850 ₴</h3>
            <div className="flex items-center gap-1 mt-2 text-blue-600 text-sm font-bold">
                 <ArrowUpRight className="w-4 h-4" />
                 +5% <span className="text-gray-400 font-medium ml-1">динаміка</span>
            </div>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-purple-100 transition-colors"></div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1">Очікується</p>
            <h3 className="text-3xl font-extrabold text-gray-900">1 500 ₴</h3>
            <div className="flex items-center gap-1 mt-2 text-orange-500 text-sm font-bold">
                 <Calendar className="w-4 h-4" />
                 1 платіж <span className="text-gray-400 font-medium ml-1">в обробці</span>
            </div>
         </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[2.5rem] p-6 md:p-8 border border-gray-100 shadow-sm">
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Пошук операцій..." 
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-[var(--fin-primary)] focus:bg-white transition-all outline-none font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex gap-2 shrink-0">
                <button className="flex items-center gap-2 px-5 py-3.5 bg-gray-50 text-gray-700 font-bold text-sm rounded-2xl hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                    <Calendar className="w-4 h-4" />
                    Лютий 2026
                </button>
                <button className="flex items-center gap-2 px-5 py-3.5 bg-gray-50 text-gray-700 font-bold text-sm rounded-2xl hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                    <Filter className="w-4 h-4" />
                    Фільтри
                </button>
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

            {transactions.map((tx) => (
                <div key={tx.id} className="group relative bg-white border border-gray-100 rounded-3xl p-4 hover:border-[var(--fin-primary)]/30 hover:shadow-lg hover:shadow-[var(--fin-primary)]/5 transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    
                    {/* Source & Icon */}
                    <div className="md:col-span-5 flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl ${tx.iconBg} ${tx.iconColor} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm`}>
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
                        {tx.date}
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
                            +{tx.amount} ₴
                        </span>
                        <button className="p-2 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ))}
        </div>

        <div className="mt-8 flex justify-center">
            <button className="text-sm font-bold text-gray-500 hover:text-[var(--fin-primary)] transition-colors px-6 py-2 rounded-xl hover:bg-gray-50">
                Завантажити ще
            </button>
        </div>

      </div>
    </div>
  );
}
