"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Plus, X } from "lucide-react";
import { createExpense, getExpenseCategories } from "@/app/actions/expenses";
import { emitDashboardEvent, type ExpenseRow } from "@/lib/dashboard-events";
import { useToast } from "@/components/providers/ToastProvider";
import { enqueueOffline } from "@/lib/offline-queue";
import { useSWRConfig } from "swr";
import { queueDashboardRevalidateByPriority } from "@/lib/dashboard-swr";

export default function AddExpenseModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>(["Інше"]);
  const toast = useToast();
  const { mutate } = useSWRConfig();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");

  useEffect(() => {
    async function loadCategories() {
      const list = await getExpenseCategories();
      setCategories(list);
      setCategory((current) => current || list[0] || "Інше");
    }
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const tempId = `temp-expense-${Date.now()}`;
    const formData = {
      amount: parseFloat(amount),
      category,
      date: new Date(date),
      description
    };
    const optimisticRow: ExpenseRow = {
      id: tempId,
      amount: formData.amount,
      category: formData.category,
      date: formData.date,
      description: formData.description || null
    };
    emitDashboardEvent("expense:create:optimistic", { row: optimisticRow });
    try {
      if (!navigator.onLine) {
        enqueueOffline({ type: "expense.create", payload: formData as unknown as Record<string, unknown> });
        setIsOpen(false);
        setAmount("");
        setCategory(categories[0] || "Інше");
        setDescription("");
        toast.info({ title: "Офлайн: витрату додано в чергу", description: "Синхронізується автоматично при відновленні мережі." });
        return;
      }

      const result = await createExpense(formData);
      if (result.success && result.expense) {
        emitDashboardEvent("expense:create:confirm", { tempId, row: result.expense });
        setIsOpen(false);
        setAmount("");
        setCategory(categories[0] || "Інше");
        setDescription("");
        toast.success({ title: "Витрату додано" });
        queueDashboardRevalidateByPriority(mutate, { immediate: ["expenses"], deferred: ["statistics"] });
      } else {
        emitDashboardEvent("expense:create:rollback", { tempId });
        try {
          const apiRes = await fetch("/api/expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          });
          if (apiRes.ok) {
            const json = await apiRes.json();
            emitDashboardEvent("expense:create:confirm", { tempId, row: json.expense });
            setIsOpen(false);
            setAmount("");
            setCategory(categories[0] || "Інше");
            setDescription("");
            toast.success({ title: "Витрату додано" });
            queueDashboardRevalidateByPriority(mutate, { immediate: ["expenses"], deferred: ["statistics"] });
          } else {
            toast.error({ title: "Помилка при створенні витрати", description: result.error || "Спробуйте ще раз." });
          }
        } catch {
          enqueueOffline({ type: "expense.create", payload: formData as unknown as Record<string, unknown> });
          setIsOpen(false);
          toast.info({ title: "Офлайн: витрату додано в чергу" });
        }
      }
    } catch (error) {
      emitDashboardEvent("expense:create:rollback", { tempId });
      console.error(error);
      toast.error({ title: "Помилка при створенні витрати" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="md"
        className="min-w-[148px]"
        leftIcon={<Plus className="w-5 h-5" />}
      >
        Додати витрату
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
          <div className="relative bg-white rounded-[2rem] w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-extrabold text-gray-900">Нова витрата</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Сума (₴)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full text-3xl font-extrabold p-4 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-[var(--fin-primary)] rounded-2xl outline-none transition-all text-gray-900 placeholder:text-gray-900"
                    placeholder="0.00"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">₴</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Категорія</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-[var(--fin-primary)] rounded-xl outline-none transition-all font-medium appearance-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Опис</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Напр. Підписка, транспорт"
                  className="w-full p-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-[var(--fin-primary)] rounded-xl outline-none transition-all font-medium placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Дата</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-[var(--fin-primary)] rounded-xl outline-none transition-all font-medium"
                />
              </div>

              <Button type="submit" disabled={isLoading} isLoading={isLoading} className="w-full py-4 text-lg rounded-xl mt-4">
                Зберегти витрату
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
