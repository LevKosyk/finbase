"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { X, Save } from "lucide-react";
import { updateIncome } from "@/app/actions/income";
import { emitDashboardEvent, type IncomeRow } from "@/lib/dashboard-events";
import { useToast } from "@/components/providers/ToastProvider";
import { useSWRConfig } from "swr";
import { queueDashboardRevalidateByPriority } from "@/lib/dashboard-swr";

interface EditIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  income: IncomeRow | null;
}

export default function EditIncomeModal({ isOpen, onClose, income }: EditIncomeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("job");
  const toast = useToast();
  const { mutate } = useSWRConfig();

  useEffect(() => {
    if (income) {
      setAmount(income.amount.toString());
      setSource(income.source);
      setDate(new Date(income.date).toISOString().split("T")[0]);
      setType(income.type);
    }
  }, [income]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!income) return;
    setIsLoading(true);

    const previous: IncomeRow = {
      ...income,
      date: new Date(income.date),
    };
    const next: IncomeRow = {
      ...income,
      amount: parseFloat(amount),
      source,
      date: new Date(date),
      type,
    };

    try {
      emitDashboardEvent("income:update:optimistic", { id: income.id, row: next });
      const result = await updateIncome(income.id, {
        amount: next.amount,
        source: next.source,
        date: new Date(next.date),
        type: next.type,
      });
      if (result.success && result.income) {
        emitDashboardEvent("income:update:optimistic", { id: income.id, row: result.income });
        queueDashboardRevalidateByPriority(mutate, { immediate: ["income"], deferred: ["statistics"] });
        toast.success({ title: "Дохід оновлено" });
        onClose();
      } else {
        emitDashboardEvent("income:update:rollback", { id: income.id, previous });
        toast.error({ title: "Помилка при оновленні доходу", description: result.error || "Спробуйте ще раз." });
      }
    } catch (error) {
      emitDashboardEvent("income:update:rollback", { id: income.id, previous });
      console.error(error);
      toast.error({ title: "Помилка при оновленні доходу" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-md animate-in zoom-in-95 rounded-[2rem] bg-white p-6 shadow-2xl duration-200 md:p-8 dark:bg-gray-900">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Редагувати дохід</h2>
          <button onClick={onClose} className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Сума (₴)</label>
            <div className="relative">
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-2xl border-2 border-transparent bg-gray-50 p-4 text-3xl font-extrabold text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:border-[var(--fin-primary)] focus:bg-white dark:bg-gray-800 dark:text-gray-100 dark:focus:bg-gray-800"
                placeholder="0.00"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">₴</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Джерело</label>
            <input
              type="text"
              required
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Напр. Upwork, Клієнт А"
              className="w-full rounded-xl border border-gray-100 bg-gray-50 p-4 font-medium outline-none transition-all placeholder:text-gray-400 focus:border-[var(--fin-primary)] focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:bg-gray-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Дата</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-gray-100 bg-gray-50 p-4 font-medium outline-none transition-all focus:border-[var(--fin-primary)] focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:bg-gray-800"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Тип</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-100 bg-gray-50 p-4 font-medium outline-none transition-all focus:border-[var(--fin-primary)] focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:bg-gray-800"
              >
                <option value="job">Послуги</option>
                <option value="product">Продаж</option>
                <option value="consulting">Консультація</option>
              </select>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            isLoading={isLoading}
            className="mt-4 w-full rounded-xl py-4 text-lg"
            leftIcon={<Save className="h-5 w-5" />}
          >
            Зберегти зміни
          </Button>
        </form>
      </div>
    </div>
  );
}
