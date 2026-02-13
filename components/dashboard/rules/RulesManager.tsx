"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import {
  createCategorizationRule,
  deleteCategorizationRule,
  updateCategorizationRule,
} from "@/app/actions/categorization-rules";
import type { CategorizationRuleInput } from "@/lib/types/rules";
import { useRouter } from "next/navigation";

interface Rule {
  id: string;
  direction: string;
  category: string;
  containsText: string | null;
  counterpartyContains: string | null;
  priority: number;
  isActive: boolean;
}

export default function RulesManager({ initialRules }: { initialRules: Rule[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const [form, setForm] = useState<CategorizationRuleInput>({
    direction: "expense",
    category: "",
    containsText: "",
    counterpartyContains: "",
    priority: 100,
    isActive: true,
  });
  const [error, setError] = useState("");

  const createRule = () => {
    setError("");
    startTransition(async () => {
      const res = await createCategorizationRule(form);
      if (!res.success) {
        setError(res.error || "Помилка створення правила");
        return;
      }
      setForm({
        direction: "expense",
        category: "",
        containsText: "",
        counterpartyContains: "",
        priority: 100,
        isActive: true,
      });
      router.refresh();
    });
  };

  const toggleRule = (rule: Rule) => {
    startTransition(async () => {
      await updateCategorizationRule(rule.id, { isActive: !rule.isActive });
      router.refresh();
    });
  };

  const removeRule = (id: string) => {
    startTransition(async () => {
      await deleteCategorizationRule(id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Редактор правил категоризації</h2>
        <p className="text-gray-500">Приклад: якщо опис містить `facebook ads` - категорія `Маркетинг`.</p>

        {error && <div className="rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={form.direction}
            onChange={(e) => setForm((f) => ({ ...f, direction: e.target.value as "expense" | "income" | "auto" }))}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
          >
            <option value="expense">Витрати</option>
            <option value="income">Доходи</option>
            <option value="auto">Будь-які</option>
          </select>
          <input
            value={form.category || ""}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            placeholder="Категорія"
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
          />
          <input
            value={form.containsText || ""}
            onChange={(e) => setForm((f) => ({ ...f, containsText: e.target.value }))}
            placeholder="Опис містить..."
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
          />
          <input
            value={form.counterpartyContains || ""}
            onChange={(e) => setForm((f) => ({ ...f, counterpartyContains: e.target.value }))}
            placeholder="Контрагент містить..."
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
          />
          <input
            type="number"
            value={form.priority || 100}
            onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
            placeholder="Пріоритет (менше = важливіше)"
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
          />
        </div>

        <Button onClick={createRule} isLoading={pending}>Додати правило</Button>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Поточні правила</h3>
        {initialRules.length === 0 ? (
          <p className="text-gray-500">Правил поки немає.</p>
        ) : (
          <div className="space-y-3">
            {initialRules.map((rule) => (
              <div key={rule.id} className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">
                      {rule.direction.toUpperCase()} {"->"} {rule.category}
                    </p>
                    <p className="text-sm text-gray-600">
                      Опис: {rule.containsText || "—"} | Контрагент: {rule.counterpartyContains || "—"} | Пріоритет: {rule.priority}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => toggleRule(rule)}>
                      {rule.isActive ? "Вимкнути" : "Увімкнути"}
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => removeRule(rule.id)}>
                      Видалити
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
