"use client";

import { Crown, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function PremiumBlock() {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 rounded-2xl p-5 text-white shadow-sm h-full flex flex-col justify-between border border-white/10">
         <div className="flex items-start justify-between">
             <div>
                <h3 className="text-2xl font-bold mb-1 tracking-tight">Premium</h3>
                <p className="text-gray-400 text-xs font-medium">Всі можливості</p>
             </div>
             <div className="w-10 h-10 bg-gradient-to-br from-amber-300 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                 <Crown className="w-5 h-5 text-white fill-white" />
             </div>
         </div>

         <div className="mt-auto pt-4">
             <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Check className="w-3 h-3 text-green-400" />
                    <span>Безлімітний AI</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Check className="w-3 h-3 text-green-400" />
                    <span>PDF звіти</span>
                </div>
             </div>

             <Link href="/dashboard/billing" className="block">
                <Button 
                    className="w-full bg-white text-gray-900 hover:bg-gray-50 border-0 font-bold h-10 rounded-xl text-sm"
                >
                    Детальніше
                </Button>
             </Link>
         </div>
    </div>
  );
}
