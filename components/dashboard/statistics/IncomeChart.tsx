"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import { useState } from 'react';

interface IncomeChartProps {
    data: { date: string; amount: number; type: 'income' | 'expense' }[];
}

export default function IncomeChart({ data }: IncomeChartProps) {
    const [chartType, setChartType] = useState<'area' | 'bar'>('area');
    const formatValue = (val: number) => `${Number(val).toLocaleString("uk-UA")} ₴`;

    return (
        <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col h-[400px] hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Динаміка доходів</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Як змінювався ваш дохід у часі</p>
                </div>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                     <button 
                        onClick={() => setChartType('area')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${chartType === 'area' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}
                     >
                        Лінія
                     </button>
                     <button 
                        onClick={() => setChartType('bar')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${chartType === 'bar' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}
                     >
                        Стовпці
                     </button>
                </div>
            </div>

            <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'area' ? (
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#9ca3af', fontSize: 12 }} 
                                tickFormatter={(val) => Number(val).toLocaleString("uk-UA")}
                            />
                            <Tooltip 
                                cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)' }}
                                formatter={(value: number | undefined) => [formatValue(value || 0), "Сума"]}
                                labelFormatter={(label) => `Дата: ${label}`}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="amount" 
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorIncome)" 
                            />
                        </AreaChart>
                    ) : (
                        <BarChart data={data} barSize={32}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }} 
                                dy={10}
                            />
                             <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#9ca3af', fontSize: 12 }} 
                                tickFormatter={(val) => Number(val).toLocaleString("uk-UA")}
                            />
                            <Tooltip 
                                cursor={{ fill: '#f9fafb' }}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)' }}
                                formatter={(value: number | undefined) => [formatValue(value || 0), "Сума"]}
                                labelFormatter={(label) => `Дата: ${label}`}
                            />
                            <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 6, 6]} />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
}
