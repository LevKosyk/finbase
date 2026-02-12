"use client";

import { AlertTriangle, CheckCircle, Info } from "lucide-react";

interface FOPStats {
    limit: {
        current: number;
        max: number;
        percent: number;
        status: 'ok' | 'warning' | 'danger';
    };
}

export default function FOPLimitWidget({ stats }: { stats: FOPStats['limit'] }) {
    const { current, max, percent, status } = stats;
    
    const colorMap = {
        ok: 'bg-emerald-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-500'
    };
    
    const bgMap = {
        ok: 'bg-emerald-50 text-emerald-700',
        warning: 'bg-yellow-50 text-yellow-700',
        danger: 'bg-red-50 text-red-700'
    };

    return (
        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
                <div>
                     <h3 className="text-lg font-bold text-gray-900">Ліміт ФОП</h3>
                     <p className="text-sm text-gray-500 mt-1">Моніторинг річного ліміту доходу</p>
                </div>
                <div className={`p-2 rounded-xl ${bgMap[status]}`}>
                    {status === 'ok' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
            </div>

            <div className="mb-2 flex justify-between text-sm font-bold">
                <span className="text-gray-600">Використано: {current.toLocaleString()} ₴</span>
                <span className="text-gray-400">Ліміт: {max > 0 ? `${max.toLocaleString()} ₴` : "не задано"}</span>
            </div>

            <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${colorMap[status]}`}
                    style={{ width: `${max > 0 ? Math.min(percent, 100) : 0}%` }}
                />
            </div>
            
             <div className="flex items-start gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                    {max > 0
                        ? <>До досягнення ліміту залишилось <strong>{Math.max(0, max - current).toLocaleString()} ₴</strong>. {status === 'danger' && 'Будь ласка, будьте обережні, ви наближаєтесь до перевищення!'}</>
                        : <>Задайте річний ліміт у налаштуваннях ФОП, щоб отримувати попередження.</>
                    }
                </p>
            </div>
        </div>
    );
}
