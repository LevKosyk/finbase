"use client";

import { useEffect, useState } from "react";
import { restoreIncome } from "@/app/actions/income";
import { useToast } from "@/components/providers/ToastProvider";
import { RotateCcw } from "lucide-react";
import { emitDashboardEvent } from "@/lib/dashboard-events";
import { useSWRConfig } from "swr";

type DeletedIncome = {
  id: string;
  source: string;
  amount: number;
  date: Date | string;
  deletedAt: Date | string | null;
};

export default function IncomeTrash({ items }: { items: DeletedIncome[] }) {
  const toast = useToast();
  const [rows, setRows] = useState(items);
  const { mutate } = useSWRConfig();

  useEffect(() => {
    setRows(items);
  }, [items]);

  if (!rows.length) return null;

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <h3 className="mb-3 text-sm font-bold text-gray-900 dark:text-gray-100">Кошик доходів</h3>
      <div className="space-y-2">
        {rows.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800">
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-200">{item.source}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {item.amount.toLocaleString("uk-UA")} ₴ • {new Date(item.date).toLocaleDateString("uk-UA")}
              </div>
            </div>
            <button
              onClick={async () => {
                const res = await restoreIncome(item.id);
                if (res.success) {
                  setRows((prev) => prev.filter((entry) => entry.id !== item.id));
                  emitDashboardEvent("income:create:optimistic", {
                    row: {
                      id: item.id,
                      source: item.source,
                      amount: item.amount,
                      date: item.date,
                      status: "completed",
                      type: "other",
                    },
                  });
                  toast.success({ title: "Дохід відновлено з кошика" });
                  void mutate((key) => typeof key === "string" && (key.startsWith("/api/dashboard/income") || key.startsWith("/api/dashboard/statistics")));
                } else {
                  toast.error({ title: "Не вдалося відновити дохід" });
                }
              }}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[var(--fin-primary)] hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Відновити
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
