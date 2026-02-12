"use client";

import { Trash2, Edit2 } from "lucide-react";
import { deleteExpense } from "@/app/actions/expenses";
import { useState } from "react";
import { useRouter } from "next/navigation";
import EditExpenseModal from "@/components/dashboard/expenses/EditExpenseModal";

interface Expense {
  id: string;
  category: string;
  description?: string;
  amount: number;
  date: Date;
}

type ExpenseRow = {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  date: Date | string;
};

export default function ExpenseList({ initialExpenses }: { initialExpenses: ExpenseRow[] }) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm("Видалити цей запис?")) return;
    setIsDeleting(id);
    const result = await deleteExpense(id);
    if (result.success) {
      router.refresh();
    } else {
      alert("Помилка видалення");
    }
    setIsDeleting(null);
  };

  const handleEdit = (expense: ExpenseRow) => {
    setEditingExpense({
      ...expense,
      date: new Date(expense.date),
      description: expense.description || undefined
    });
  };

  if (!initialExpenses || initialExpenses.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-12 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
          <Edit2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Ще немає витрат</h3>
        <p className="text-gray-500">Додайте свою першу витрату, щоб побачити статистику.</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Дата</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Категорія</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Опис</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Сума</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {initialExpenses.map((expense) => (
                <tr key={expense.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Date(expense.date).toLocaleDateString("uk-UA")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">
                    {expense.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {expense.description || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-extrabold text-gray-900">
                    {expense.amount.toLocaleString("uk-UA")} ₴
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(expense)}
                      className="text-gray-400 hover:text-blue-500 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                      title="Редагувати"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      disabled={isDeleting === expense.id}
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

      <EditExpenseModal
        isOpen={!!editingExpense}
        onClose={() => {
          setEditingExpense(null);
          router.refresh();
        }}
        expense={editingExpense}
      />
    </>
  );
}
