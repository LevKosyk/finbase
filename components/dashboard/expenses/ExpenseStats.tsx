"use client";

import { memo } from "react";
import { ArrowDownRight, Calendar, TrendingDown } from "lucide-react";

interface StatsProps {
  stats: {
    total: number;
    change: number;
    average: number;
    count: number;
  };
}

function ExpenseStats({ stats }: StatsProps) {
  const changeIsUp = stats.change >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-red-100 transition-colors"></div>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1">Цей місяць</p>
        <h3 className="text-3xl font-extrabold text-gray-900">{stats.total.toLocaleString("uk-UA")} ₴</h3>
        <div className={`flex items-center gap-1 mt-2 text-sm font-bold ${changeIsUp ? "text-red-600" : "text-green-600"}`}>
          <ArrowDownRight className="w-4 h-4" />
          {changeIsUp ? "+" : ""}{stats.change}% <span className="text-gray-400 font-medium ml-1">порівняно з минулим</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-orange-100 transition-colors"></div>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1">Середня витрата</p>
        <h3 className="text-3xl font-extrabold text-gray-900">{Math.round(stats.average).toLocaleString("uk-UA")} ₴</h3>
        <div className="flex items-center gap-1 mt-2 text-orange-600 text-sm font-bold">
          <TrendingDown className="w-4 h-4" />
          <span className="text-gray-400 font-medium ml-1">контроль витрат</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-blue-100 transition-colors"></div>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1">Кількість</p>
        <h3 className="text-3xl font-extrabold text-gray-900">{stats.count.toLocaleString("uk-UA")}</h3>
        <div className="flex items-center gap-1 mt-2 text-blue-600 text-sm font-bold">
          <Calendar className="w-4 h-4" />
          {stats.count > 0 ? "є записи за місяць" : "немає записів"}
        </div>
      </div>
    </div>
  );
}

export default memo(ExpenseStats);
