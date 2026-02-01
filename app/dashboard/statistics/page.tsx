"use client";

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  Legend,
  Area,
  AreaChart,
  BarChart,
  Bar
} from 'recharts';
import { Calendar, ChevronDown, Download, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Users } from "lucide-react";
import { useState } from 'react';

const incomeData = [
  { name: 'Січ', amount: 4000, tax: 200 },
  { name: 'Лют', amount: 3000, tax: 150 },
  { name: 'Бер', amount: 2000, tax: 100 },
  { name: 'Кві', amount: 2780, tax: 139 },
  { name: 'Тра', amount: 1890, tax: 94.5 },
  { name: 'Чер', amount: 2390, tax: 119.5 },
  { name: 'Лип', amount: 3490, tax: 174.5 },
];

const categoryData = [
  { name: 'Послуги', value: 400, color: '#2563EB' },
  { name: 'Консультації', value: 300, color: '#7C3AED' },
  { name: 'Дизайн', value: 300, color: '#DB2777' },
  { name: 'Інше', value: 200, color: '#9CA3AF' },
];

const clientData = [
  { name: 'Upwork', value: 4500, percent: 35 },
  { name: 'Приватні клієнти', value: 3200, percent: 25 },
  { name: 'ФОП Петренко', value: 2100, percent: 15 },
  { name: 'IT Solutions LLC', value: 1500, percent: 12 },
];

export default function StatisticsPage() {
  const [activeTab, setActiveTab] = useState('year');

  return (
    <div className="pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
           <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Глибока Аналітика</h1>
           <p className="text-gray-500 text-lg">Детальний розріз доходів та податкового навантаження</p>
        </div>
        <div className="flex gap-2 bg-gray-100/50 p-1.5 rounded-2xl">
            {['month', 'quarter', 'year'].map((tab) => (
                <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                         activeTab === tab 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                    {tab === 'month' ? 'Місяць' : tab === 'quarter' ? 'Квартал' : 'Рік'}
                </button>
            ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm group hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                    <Wallet className="w-6 h-6" />
                </div>
                <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                    +12% <ArrowUpRight className="w-3 h-3 ml-1" />
                </span>
            </div>
            <p className="text-gray-500 text-sm font-bold mb-1">Загальний дохід</p>
            <h3 className="text-3xl font-extrabold text-gray-900">19 550 ₴</h3>
         </div>

         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm group hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-50 rounded-2xl text-purple-600">
                    <TrendingUp className="w-6 h-6" />
                </div>
                 <span className="flex items-center text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                    -2% <ArrowDownRight className="w-3 h-3 ml-1" />
                </span>
            </div>
            <p className="text-gray-500 text-sm font-bold mb-1">Податок (5%)</p>
            <h3 className="text-3xl font-extrabold text-gray-900">977.5 ₴</h3>
         </div>

         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm group hover:-translate-y-1 transition-transform duration-300">
             <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
                    <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-gray-400">Активних</span>
            </div>
            <p className="text-gray-500 text-sm font-bold mb-1">Клієнтів</p>
            <h3 className="text-3xl font-extrabold text-gray-900">12</h3>
         </div>

         <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-[2rem] text-white shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none group-hover:bg-white/20 transition-colors"></div>
            <p className="text-gray-400 text-sm font-bold mb-1 relative z-10">Чистий прибуток</p>
            <h3 className="text-3xl font-extrabold text-white mb-4 relative z-10">18 572 ₴</h3>
            <button className="relative z-10 w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors border border-white/10">
                Завантажити звіт
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
         {/* Main Income vs Tax Chart */}
         <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm h-[500px] flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                   <h3 className="text-xl font-bold text-gray-900">Дохід та Податки</h3>
                   <p className="text-gray-500 text-sm">Співвідношення валового доходу до податкових зобов'язань</p>
                </div>
                <div className="flex items-center gap-4 text-sm font-bold">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[var(--fin-primary)]"></span> Дохід
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-orange-400"></span> Податок
                    </div>
                </div>
            </div>
            
            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incomeData} barSize={12} barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#9ca3af', fontSize: 13, fontWeight: 500 }} 
                            dy={15} 
                        />
                         <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: '#9ca3af', fontSize: 12 }} 
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip 
                            cursor={{ fill: '#f9fafb' }}
                            contentStyle={{ 
                                borderRadius: '16px', 
                                border: 'none', 
                                boxShadow: '0 10px 30px -5px rgb(0 0 0 / 0.1)',
                                padding: '12px 20px',
                            }}
                        />
                        <Bar dataKey="amount" fill="var(--fin-primary)" radius={[4, 4, 4, 4]} />
                        <Bar dataKey="tax" fill="#fb923c" radius={[4, 4, 4, 4]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
         </div>

         {/* Distribution & Top Clients */}
         <div className="flex flex-col gap-6">
             {/* Category Distribution */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Структура</h3>
                <div className="flex-1 relative">
                    <ResponsiveContainer width="100%" height="200">
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-[-10px]">
                        <span className="text-xs text-gray-400 font-bold uppercase">Всього</span>
                        <div className="text-xl font-extrabold text-gray-900">100%</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                    {categoryData.map((cat) => (
                        <div key={cat.name} className="flex items-center gap-2 text-xs font-bold text-gray-600 bg-gray-50 px-3 py-2 rounded-xl">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }}></span>
                            {cat.name}
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Clients Mini-List */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Топ клієнти</h3>
                <div className="space-y-4">
                    {clientData.map((client, i) => (
                        <div key={client.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                    {i + 1}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{client.name}</p>
                                    <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                        <div className="h-full bg-[var(--fin-primary)] rounded-full" style={{ width: `${client.percent}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            <span className="text-sm font-bold text-gray-900">{client.value} ₴</span>
                        </div>
                    ))}
                </div>
            </div>
         </div>
      </div>
    </div>
  );
}
