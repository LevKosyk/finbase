"use client";

import { ArrowUpRight, Calendar, TrendingUp } from "lucide-react";

interface StatsProps {
    stats: {
        total: number;
        change: number;
        average: number;
        pending: number;
    }
}

export default function IncomeStats({ stats }: StatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-green-100 transition-colors"></div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1">Цей місяць</p>
                <h3 className="text-3xl font-extrabold text-gray-900">{stats.total.toLocaleString('uk-UA')} ₴</h3>
                <div className="flex items-center gap-1 mt-2 text-green-600 text-sm font-bold">
                    <ArrowUpRight className="w-4 h-4" />
                    +{stats.change}% <span className="text-gray-400 font-medium ml-1">порівняно з минулим</span>
                </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-blue-100 transition-colors"></div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1">Средній чек</p>
                <h3 className="text-3xl font-extrabold text-gray-900">{Math.round(stats.average).toLocaleString('uk-UA')} ₴</h3>
                <div className="flex items-center gap-1 mt-2 text-blue-600 text-sm font-bold">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-gray-400 font-medium ml-1">стабільно зростає</span>
                </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-purple-100 transition-colors"></div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wide mb-1">Очікується</p>
                <h3 className="text-3xl font-extrabold text-gray-900">{stats.pending.toLocaleString('uk-UA')} ₴</h3>
                <div className="flex items-center gap-1 mt-2 text-orange-500 text-sm font-bold">
                    <Calendar className="w-4 h-4" />
                    {stats.pending > 0 ? 'Є платежі в обробці' : 'Всі платежі отримано'}
                </div>
            </div>
        </div>
    );
}
