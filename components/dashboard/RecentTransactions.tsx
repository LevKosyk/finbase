"use client";

import { MoreHorizontal, ArrowUpRight, ArrowRight } from "lucide-react";
import Link from "next/link";

const transactions = [
  { id: 1, source: "Розробка сайту", date: "01 Лют", amount: 3000, type: "service", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  { id: 2, source: "Консультація", date: "28 Січ", amount: 5000, type: "consulting", iconBg: "bg-purple-100", iconColor: "text-purple-600" },
  { id: 3, source: "Підтримка", date: "25 Січ", amount: 1500, type: "service", iconBg: "bg-orange-100", iconColor: "text-orange-600" },
  { id: 4, source: "Дизайн лого", date: "20 Січ", amount: 2000, type: "design", iconBg: "bg-pink-100", iconColor: "text-pink-600" },
];

export default function RecentTransactions() {
  return (
    <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm h-full flex flex-col hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-lg font-bold text-gray-900">Останні доходи</h2>
        <Link href="/dashboard/income" className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <ArrowRight className="w-4 h-4 text-gray-600" />
        </Link>
      </div>

      <div className="flex-1 space-y-4">
        {transactions.map((tx) => (
            <div key={tx.id} className="group flex items-center justify-between p-3 -mx-3 rounded-2xl hover:bg-gray-50 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${tx.iconBg} ${tx.iconColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm group-hover:text-[var(--fin-primary)] transition-colors">{tx.source}</h4>
                        <p className="text-xs text-gray-500 font-medium">{tx.date}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-gray-900">+ {tx.amount} ₴</p>
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
