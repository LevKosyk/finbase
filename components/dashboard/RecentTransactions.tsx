"use client";

import { ArrowUpRight, Inbox, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Transaction {
  id: string;
  amount: number;
  source: string;
  date: string;
  type: string;
}

interface RecentTransactionsProps {
  initialData: Transaction[];
}

export default function RecentTransactions({ initialData }: RecentTransactionsProps) {
  const transactions = initialData.slice(0, 5);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Останні доходи</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {transactions.length > 0 ? `${transactions.length}\u00a0записів` : "Немає даних"}
          </p>
        </div>
        <Link
          href="/dashboard/income"
          className="w-8 h-8 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 flex flex-col">
        {transactions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2">
            <Inbox className="w-9 h-9 text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">Немає операцій</p>
            <Link
              href="/dashboard/income"
              className="text-xs font-bold text-(--fin-primary) hover:opacity-75 transition-opacity"
            >
              Додати дохід
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="group flex items-center justify-between px-3 py-2.5 -mx-1 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-35 group-hover:text-(--fin-primary) transition-colors">
                      {tx.source}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                      {new Date(tx.date).toLocaleDateString("uk-UA", { day: "2-digit", month: "short" })}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    +{tx.amount.toLocaleString("uk-UA")}&nbsp;&#8372;
                  </p>
                  <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">
                    {tx.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {transactions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
          <Link
            href="/dashboard/income"
            className="flex items-center justify-center gap-1.5 text-xs font-bold text-(--fin-primary) hover:opacity-75 transition-opacity"
          >
            Переглянути всі <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
