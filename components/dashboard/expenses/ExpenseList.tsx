"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2, Edit2 } from "lucide-react";
import { deleteExpense, restoreExpense } from "@/app/actions/expenses";
import EditExpenseModal from "@/components/dashboard/expenses/EditExpenseModal";
import DataState from "@/components/ui/DataState";
import { useToast } from "@/components/providers/ToastProvider";
import { subscribeDashboardEvent, type ExpenseRow } from "@/lib/dashboard-events";
import { useSWRConfig } from "swr";

function sortExpenses(rows: ExpenseRow[]) {
  return [...rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export default function ExpenseList({ initialExpenses }: { initialExpenses: ExpenseRow[] }) {
  const [rows, setRows] = useState<ExpenseRow[]>(() => sortExpenses(initialExpenses || []));
  const [editingExpense, setEditingExpense] = useState<ExpenseRow | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { mutate } = useSWRConfig();
  const toast = useToast();

  useEffect(() => {
    setRows(sortExpenses(initialExpenses || []));
  }, [initialExpenses]);

  useEffect(() => {
    const unsubscribers = [
      subscribeDashboardEvent("expense:create:optimistic", ({ row }) => {
        setRows((prev) => sortExpenses([row, ...prev]));
      }),
      subscribeDashboardEvent("expense:create:confirm", ({ tempId, row }) => {
        setRows((prev) => sortExpenses(prev.map((item) => (item.id === tempId ? row : item))));
      }),
      subscribeDashboardEvent("expense:create:rollback", ({ tempId }) => {
        setRows((prev) => prev.filter((item) => item.id !== tempId));
      }),
      subscribeDashboardEvent("expense:update:optimistic", ({ id, row }) => {
        setRows((prev) => sortExpenses(prev.map((item) => (item.id === id ? row : item))));
      }),
      subscribeDashboardEvent("expense:update:rollback", ({ id, previous }) => {
        setRows((prev) => sortExpenses(prev.map((item) => (item.id === id ? previous : item))));
      }),
    ];
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const rowCountLabel = useMemo(() => `${rows.length} записів`, [rows.length]);

  const handleDelete = async (id: string) => {
    const target = rows.find((row) => row.id === id);
    if (!target) return;
    if (!confirm("Видалити цей запис?")) return;

    setIsDeleting(id);
    setRows((prev) => prev.filter((item) => item.id !== id));

    const result = await deleteExpense(id);
    if (result.success) {
      toast.success({
        title: "Витрату переміщено в кошик",
        actionLabel: "Скасувати",
        onAction: async () => {
          const restored = await restoreExpense(id);
          if (restored.success) {
            setRows((prev) => sortExpenses([target, ...prev]));
            toast.info({ title: "Витрату відновлено" });
            void mutate((key) => typeof key === "string" && (key.startsWith("/api/dashboard/expenses") || key.startsWith("/api/dashboard/statistics")));
          } else {
            toast.error({ title: "Не вдалося відновити витрату" });
          }
        },
      });
      void mutate((key) => typeof key === "string" && (key.startsWith("/api/dashboard/expenses") || key.startsWith("/api/dashboard/statistics")));
    } else {
      setRows((prev) => sortExpenses([target, ...prev]));
      toast.error({ title: "Не вдалося видалити витрату", description: result.error || "Спробуйте ще раз" });
    }
    setIsDeleting(null);
  };

  if (!rows.length) {
    return (
      <DataState
        variant="empty"
        title="Ще немає витрат"
        description="Додайте першу витрату або імпортуйте файл, щоб сформувати звітність."
      />
    );
  }

  return (
    <>
      <div className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">{rowCountLabel}</div>
      <div className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-100 bg-gray-50/60 dark:border-gray-700 dark:bg-gray-800/60">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Дата</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Категорія</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Опис</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Сума</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {rows.map((expense) => (
                <tr key={expense.id} className="group transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(expense.date).toLocaleDateString("uk-UA")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-200">{expense.category}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{expense.description || "—"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-extrabold text-gray-900 dark:text-gray-100">
                    {expense.amount.toLocaleString("uk-UA")} ₴
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => setEditingExpense(expense)}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-950/40"
                      title="Редагувати"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      disabled={isDeleting === expense.id}
                      className="ml-2 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                      title="Видалити"
                    >
                      <Trash2 className="h-4 w-4" />
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
          void mutate((key) => typeof key === "string" && (key.startsWith("/api/dashboard/expenses") || key.startsWith("/api/dashboard/statistics")));
        }}
        expense={editingExpense}
      />
    </>
  );
}
