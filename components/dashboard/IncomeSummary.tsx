"use client";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell 
} from 'recharts';
import { useState } from 'react';
import { ChevronDown, TrendingUp, Calendar } from 'lucide-react';
import { Button } from "@/components/ui/Button";

const data = [
  { name: 'Січ', income: 4000 },
  { name: 'Лют', income: 3000 },
  { name: 'Бер', income: 2000 },
  { name: 'Кві', income: 2780 },
  { name: 'Тра', income: 1890 },
  { name: 'Чер', income: 2390 },
  { name: 'Лип', income: 3490 },
];

export default function IncomeSummary() {
  const [period, setPeriod] = useState('Цей рік');

  return (
    <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm h-full flex flex-col hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between mb-8">
        <div>
            <div className="flex items-center gap-2 mb-2">
                 <div className="p-2 bg-green-50 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                 </div>
                 <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Загальний дохід</h2>
            </div>
            <div className="flex items-baseline gap-3">
                <span className="text-4xl font-extrabold text-gray-900">12 450 ₴</span>
                <span className="text-sm font-bold text-green-600 bg-green-100/50 px-2 py-1 rounded-lg">
                    +12.5%
                </span>
            </div>
        </div>
        <Button 
            variant="ghost" 
            className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 transition-colors h-auto shadow-none"
        >
            <Calendar className="w-3 h-3" />
            {period}
            <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </div>

      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={40}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9ca3af', fontSize: 13, fontWeight: 500 }} 
                dy={15}
            />
            <Tooltip 
                cursor={{ fill: '#f9fafb' }}
                contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', 
                    padding: '12px 16px',
                    fontWeight: 600
                }}
            />
            <Bar dataKey="income" radius={[12, 12, 12, 12]}>
              {data.map((entry, index) => (
                <Cell 
                    key={`cell-${index}`} 
                    fill={index === data.length - 1 ? 'url(#colorGradient)' : '#f3f4f6'} 
                    className="transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Bar>
            <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--fin-primary)" stopOpacity={1}/>
                    <stop offset="100%" stopColor="var(--fin-primary)" stopOpacity={0.7}/>
                </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
