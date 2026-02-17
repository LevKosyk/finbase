"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2, Edit2 } from "lucide-react";
import { deleteIncome, restoreIncome } from "@/app/actions/income";
import EditIncomeModal from "@/components/dashboard/income/EditIncomeModal";
import DataState from "@/components/ui/DataState";
import { useToast } from "@/components/providers/ToastProvider";
import { subscribeDashboardEvent, type IncomeRow } from "@/lib/dashboard-events";
import { useSWRConfig } from "swr";

function sortIncomes(rows: IncomeRow[]) {
  return [...rows].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export default function IncomeList({ initialIncomes }: { initialIncomes: IncomeRow[] }) {
  const [rows, setRows] = useState<IncomeRow[]>(() => sortIncomes(initialIncomes || []));
  const [editingIncome, setEditingIncome] = useState<IncomeRow | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const { mutate } = useSWRConfig();
  const toast = useToast();

  useEffect(() => {
    setRows(sortIncomes(initialIncomes || []));
  }, [initialIncomes]);

  useEffect(() => {
    const unsubscribers = [
      subscribeDashboardEvent("income:create:optimistic", ({ row }) => {
        setRows((prev) => sortIncomes([row, ...prev]));
      }),
      subscribeDashboardEvent("income:create:confirm", ({ tempId, row }) => {
        setRows((prev) => sortIncomes(prev.map((item) => (item.id === tempId ? row : item))));
      }),
      subscribeDashboardEvent("income:create:rollback", ({ tempId }) => {
        setRows((prev) => prev.filter((item) => item.id !== tempId));
      }),
      subscribeDashboardEvent("income:update:optimistic", ({ id, row }) => {
        setRows((prev) => sortIncomes(prev.map((item) => (item.id === id ? row : item))));
      }),
      subscribeDashboardEvent("income:update:rollback", ({ id, previous }) => {
        setRows((prev) => sortIncomes(prev.map((item) => (item.id === id ? previous : item))));
      }),
    ];
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const hasRows = rows.length > 0;
  const rowCountLabel = useMemo(() => `${rows.length} записів`, [rows.length]);

  const handleDelete = async (id: string) => {
    const target = rows.find((row) => row.id === id);
    if (!target) return;
    if (!confirm("Видалити цей запис?")) return;

    setIsDeleting(id);
    setRows((prev) => prev.filter((item) => item.id !== id));

    const result = await deleteIncome(id);
    if (result.success) {
      toast.success({
        title: "Дохід переміщено в кошик",
        actionLabel: "Скасувати",
        onAction: async () => {
          const restored = await restoreIncome(id);
          if (restored.success) {
            setRows((prev) => sortIncomes([target, ...prev]));
            toast.info({ title: "Дохід відновлено" });
            void mutate((key) => typeof key === "string" && (key.startsWith("/api/dashboard/income") || key.startsWith("/api/dashboard/statistics")));
          } else {
            toast.error({ title: "Не вдалося відновити дохід" });
          }
        },
      });
      void mutate((key) => typeof key === "string" && (key.startsWith("/api/dashboard/income") || key.startsWith("/api/dashboard/statistics")));
    } else {
      setRows((prev) => sortIncomes([target, ...prev]));
      toast.error({ title: "Не вдалося видалити дохід", description: result.error || "Спробуйте ще раз" });
    }
    setIsDeleting(null);
  };

  if (!hasRows) {
    return (
      <DataState
        variant="empty"
        title="Ще немає доходів"
        description="Додайте перший дохід або імпортуйте файл, щоб побачити записи тут."
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
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Джерело</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Тип</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Сума</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {rows.map((income) => (
                <tr key={income.id} className="group transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {new Date(income.date).toLocaleDateString("uk-UA")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-200">{income.source}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {income.type === "job" ? "Послуга" : income.type === "product" ? "Товар" : "Інше"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-extrabold text-gray-900 dark:text-gray-100">
                    {income.amount.toLocaleString("uk-UA")} ₴
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => setEditingIncome(income)}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-950/40"
                      title="Редагувати"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(income.id)}
                      disabled={isDeleting === income.id}
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

      <EditIncomeModal
        isOpen={!!editingIncome}
        onClose={() => {
          setEditingIncome(null);
          void mutate((key) => typeof key === "string" && (key.startsWith("/api/dashboard/income") || key.startsWith("/api/dashboard/statistics")));
        }}
        income={editingIncome}
      />
    </>
  );
}
