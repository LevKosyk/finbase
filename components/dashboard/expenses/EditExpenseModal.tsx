"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { X, Save } from "lucide-react";
import { getExpenseCategories, updateExpense } from "@/app/actions/expenses";

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: {
    id: string;
    amount: number;
    category: string;
    date: Date | string;
    description?: string | null;
  } | null;
}

export default function EditExpenseModal({ isOpen, onClose, expense }: EditExpenseModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>(["Інше"]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    async function loadCategories() {
      const list = await getExpenseCategories();
      setCategories(list);
      setCategory((current) => current || list[0] || "Інше");
    }
    loadCategories();
  }, []);

  useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toString());
      setCategory(expense.category || categories[0] || "Інше");
      setDate(new Date(expense.date).toISOString().split("T")[0]);
      setDescription(expense.description || "");
    }
  }, [expense, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await updateExpense(expense.id, {
        amount: parseFloat(amount),
        category,
        date: new Date(date),
        description
      });
      if (result.success) {
        onClose();
      } else {
        alert("Помилка при оновленні");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-white rounded-[2rem] w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-extrabold text-gray-900">Редагувати витрату</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
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

          <Button type="submit" disabled={isLoading} isLoading={isLoading} className="w-full py-4 text-lg rounded-xl mt-4" leftIcon={<Save className="w-5 h-5" />}>
            Зберегти зміни
          </Button>
        </form>
      </div>
    </div>
  );
}
