"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Plus, X } from "lucide-react";
import { createIncome } from "@/app/actions/income";
import { emitDashboardEvent, type IncomeRow } from "@/lib/dashboard-events";
import { useToast } from "@/components/providers/ToastProvider";
import { enqueueOffline } from "@/lib/offline-queue";
import { useSWRConfig } from "swr";
import { queueDashboardRevalidateByPriority } from "@/lib/dashboard-swr";

export default function AddIncomeModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const { mutate } = useSWRConfig();
    
    // Form State
    const [amount, setAmount] = useState('');
    const [source, setSource] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState('job');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const tempId = `temp-income-${Date.now()}`;

        try {
            const formData = {
                amount: parseFloat(amount),
                source,
                date: new Date(date),
                type,
                status: 'completed'
            };
            const optimisticRow: IncomeRow = { id: tempId, ...formData };
            emitDashboardEvent("income:create:optimistic", { row: optimisticRow });

            if (!navigator.onLine) {
                enqueueOffline({ type: "income.create", payload: formData as unknown as Record<string, unknown> });
                setIsOpen(false);
                setAmount('');
                setSource('');
                setType('job');
                toast.info({ title: "Офлайн: дохід додано в чергу", description: "Синхронізується автоматично при відновленні мережі." });
                return;
            }

            const result = await createIncome(formData);
            if (result.success && result.income) {
                emitDashboardEvent("income:create:confirm", { tempId, row: result.income });
                setIsOpen(false);
                // Reset form
                setAmount('');
                setSource('');
                setType('job');
                toast.success({ title: "Дохід додано" });
                queueDashboardRevalidateByPriority(mutate, { immediate: ["income"], deferred: ["statistics"] });
            } else {
                emitDashboardEvent("income:create:rollback", { tempId });
                try {
                    const apiRes = await fetch("/api/income", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(formData),
                    });
                    if (apiRes.ok) {
                      const json = await apiRes.json();
                      emitDashboardEvent("income:create:confirm", { tempId, row: json.income });
                      setIsOpen(false);
                      setAmount('');
                      setSource('');
                      setType('job');
                      toast.success({ title: "Дохід додано" });
                      queueDashboardRevalidateByPriority(mutate, { immediate: ["income"], deferred: ["statistics"] });
                    } else {
                      toast.error({ title: "Помилка при створенні доходу", description: result.error || "Спробуйте ще раз." });
                    }
                } catch {
                  enqueueOffline({ type: "income.create", payload: formData as unknown as Record<string, unknown> });
                  setIsOpen(false);
                  toast.info({ title: "Офлайн: дохід додано в чергу" });
                }
            }
        } catch (error) {
            emitDashboardEvent("income:create:rollback", { tempId });
            console.error(error);
            toast.error({ title: "Помилка при створенні доходу" });
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
                Додати дохід
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsOpen(false)} />
                    
                    <div className="relative bg-white rounded-[2rem] w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 p-6 md:p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-extrabold text-gray-900">Новий дохід</h2>
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
                                <label className="text-sm font-bold text-gray-700">Джерело</label>
                                <input 
                                    type="text" 
                                    required
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                    placeholder="Напр. Upwork, Клієнт А"
                                    className="w-full p-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-[var(--fin-primary)] rounded-xl outline-none transition-all font-medium placeholder:text-gray-400"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Тип</label>
                                    <select 
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        className="w-full p-4 bg-gray-50 border border-gray-100 focus:bg-white focus:border-[var(--fin-primary)] rounded-xl outline-none transition-all font-medium appearance-none"
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
                                className="w-full py-4 text-lg rounded-xl mt-4"
                            >
                                Зберегти дохід
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
