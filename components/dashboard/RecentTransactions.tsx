"use client";

import { MoreHorizontal, ArrowUpRight, ArrowRight } from "lucide-react";
import Link from "next/link";

interface RecentTransactionsProps {
    initialData: any[]; // Replace 'any' with Income type from Prisma if possible, or define interface
}

export default function RecentTransactions({ initialData }: RecentTransactionsProps) {
  // Use initialData mostly, but slice to 4 as in original design
  const transactions = initialData.slice(0, 4); 

  return (
    <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm h-full flex flex-col hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-bold text-gray-900">Останні доходи</h2>
        <Link href="/dashboard/income" className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <ArrowRight className="w-4 h-4 text-gray-600" />
        </Link>
      </div>

      <div className="flex-1 space-y-4">
        {transactions.length === 0 ? (
            <div className="text-center text-gray-400 py-10">Немає операцій</div>
        ) : transactions.map((tx) => (
            <div key={tx.id} className="group flex items-center justify-between p-3 -mx-3 rounded-2xl hover:bg-gray-50 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm group-hover:text-[var(--fin-primary)] transition-colors">{tx.source}</h4>
                        <p className="text-xs text-gray-500 font-medium">
                            {new Date(tx.date).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short' })}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-gray-900">+ {tx.amount.toLocaleString()} ₴</p>
                    <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {tx.type}
                    </span>
                </div>
            </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-50 text-center">
         <Link href="/dashboard/income" className="text-sm font-bold text-[var(--fin-primary)] hover:opacity-80 transition-opacity">
            Переглянути всі
         </Link>
      </div>
    </div>
  );
}
