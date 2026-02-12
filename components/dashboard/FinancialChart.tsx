"use client";

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { DashboardStats } from "@/app/actions/dashboard";

interface FinancialChartProps {
    data: DashboardStats['income']['history'];
}

export default function FinancialChart({ data }: FinancialChartProps) {
  return (
    <div className="bg-white rounded-[32px] p-6 md:p-8 border border-gray-100 shadow-sm h-full relative overflow-hidden group hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-8 relative z-10">
        <div>
            <h3 className="text-lg font-bold text-gray-900">Фінансова картина</h3>
            <p className="text-sm text-gray-400">Динаміка доходів та витрат</p>
        </div>
        <div className="flex bg-gray-50 px-4 py-2 rounded-xl text-xs font-bold text-gray-600">
            Поточний рік
        </div>
      </div>

      <div className="h-[300px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--fin-primary)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--fin-primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                dy={10} 
            />
            <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip 
                contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    color: '#fff'
                }}
                itemStyle={{ color: '#fff' }}
                cursor={{ stroke: 'var(--fin-primary)', strokeWidth: 2, strokeDasharray: '5 5' }}
                formatter={(value: any) => [`${Number(value).toLocaleString()} ₴`, 'Дохід']}
            />
            <Area 
                type="monotone" 
                dataKey="value" 
                stroke="var(--fin-primary)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorIncome)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
