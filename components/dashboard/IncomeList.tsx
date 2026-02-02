"use client";

import { Trash2, Edit2, MoreHorizontal } from "lucide-react";
import { deleteIncome } from "@/app/actions/income";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Income {
  id: string;
  source: string;
  amount: number;
  date: Date;
  status: string;
  type: string;
}

export default function IncomeList({ initialIncomes }: { initialIncomes: any[] }) {
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const router = useRouter();

    const handleDelete = async (id: string) => {
        if (!confirm('Видалити цей запис?')) return;
        
        setIsDeleting(id);
        const result = await deleteIncome(id);
        if (result.success) {
            router.refresh();
        } else {
            alert('Помилка видалення');
        }
        setIsDeleting(null);
    };

    if (!initialIncomes || initialIncomes.length === 0) {
        return (
             <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <Edit2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Ще немає доходів</h3>
                <p className="text-gray-500">Додайте свій перший дохід, щоб побачити статистику.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Дата</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Джерело</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Тип</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Сума</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Дії</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {initialIncomes.map((income) => (
                            <tr key={income.id} className="group hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {new Date(income.date).toLocaleDateString('uk-UA')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                                    {income.source}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className="bg-gray-100 px-2 py-1 rounded-lg text-xs font-bold text-gray-600">
                                        {income.type === 'job' ? 'Послуга' : income.type === 'product' ? 'Товар' : 'Інше'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-extrabold text-gray-900">
                                    {income.amount.toLocaleString('uk-UA')} ₴
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button 
                                        onClick={() => handleDelete(income.id)}
                                        disabled={isDeleting === income.id}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                        title="Видалити"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
