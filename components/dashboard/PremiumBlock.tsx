"use client";

import { Crown, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function PremiumBlock() {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 rounded-[24px] p-6 text-white shadow-xl relative overflow-hidden h-full flex flex-col justify-between group border border-white/5">
         
         {/* Background Effects */}
         <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--fin-primary)]/20 rounded-full blur-[60px] -mr-16 -mt-16 pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] -ml-8 -mb-8 pointer-events-none"></div>

         <div className="relative z-10">
             <div className="w-12 h-12 bg-gradient-to-br from-amber-300 to-yellow-500 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform duration-300">
                 <Crown className="w-6 h-6 text-white fill-white" />
             </div>
             <h3 className="text-2xl font-bold mb-2">Premium План</h3>
             <p className="text-gray-400 text-sm font-medium leading-relaxed">
                Отримайте доступ до розширеної аналітики та необмеженого AI асистента.
             </p>
         </div>

         <div className="relative z-10 space-y-4 mt-6">
             <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span>Безлімітні запити до AI</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-green-400" />
                    </div>
                    <span>Експорт звітів у PDF/CSV</span>
                </div>
             </div>

             <Link href="/dashboard/billing" className="block">
                <Button 
                    className="w-full bg-white text-gray-900 hover:bg-gray-100 border-0 font-bold h-12 rounded-xl shadow-lg hover:shadow-white/10 transition-all"
                >
                    Спробувати Pro
                </Button>
             </Link>
         </div>
    </div>
  );
}
