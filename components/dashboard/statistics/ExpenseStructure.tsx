"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface ExpenseStructureProps {
    data: { name: string; value: number; color: string }[];
}

export default function ExpenseStructure({ data }: ExpenseStructureProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-900 p-6 rounded-[24px] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center h-[320px]">
                 <p className="text-gray-400 dark:text-gray-500 font-medium">Немає витрат за цей період</p>
            </div>
        );
    }

    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col h-[320px] hover:shadow-md transition-shadow duration-300">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Структура витрат</h3>
            <div className="flex-1 flex gap-4">
                 <div className="w-1/2 relative h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)' }}
                                formatter={(value: number | undefined) => [`${Number(value || 0).toLocaleString("uk-UA")} ₴`, "Сума"]}
                                labelFormatter={(label) => `Категорія: ${label}`}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-[-5px]">
                        <p className="text-[10px] uppercase text-gray-400 dark:text-gray-500 font-bold">Всього</p>
                        <p className="text-sm font-extrabold text-gray-900 dark:text-gray-100">{total.toLocaleString()} ₴</p>
                    </div>
                </div>
                
                <div className="w-1/2 flex flex-col justify-center gap-2 overflow-auto pr-2">
                    {data.slice(0, 4).map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                             <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                                <span className="text-gray-600 dark:text-gray-300 font-medium truncate max-w-[80px]" title={item.name}>{item.name}</span>
                             </div>
                             <span className="font-bold text-gray-900 dark:text-gray-100">{Math.round((item.value / total) * 100)}%</span>
                        </div>
                    ))}
                    {data.length > 4 && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-center font-medium">+ ще {data.length - 4}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
