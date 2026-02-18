"use client";

import { Sparkles, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useUI } from "@/components/providers/UIProvider";

export default function AIWidget() {
  const { openAIHelper } = useUI();
  return (
    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-sm h-full flex flex-col justify-between">
         <div className="cursor-pointer flex items-center justify-between" onClick={() => openAIHelper()}>
             <div>
                <h3 className="text-xl font-bold mb-1">Спроси AI</h3>
                <p className="text-indigo-100 text-xs font-medium opacity-90">Поради по доходах, витратах і податках</p>
             </div>
             <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                 <Sparkles className="w-5 h-5 text-white" />
             </div>
         </div>

         <div className="mt-4 space-y-2">
             <button onClick={() => openAIHelper("Скільки податків я маю заплатити?")} className="w-full text-left px-3 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-[11px] font-semibold text-white border border-white/10 transition-all flex items-center justify-between group/btn">
                 "Скільки податків платити?"
                 <ArrowRight className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
             </button>
             <button onClick={() => openAIHelper("Що треба зробити сьогодні по ФОП?")} className="w-full text-left px-3 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-[11px] font-semibold text-white border border-white/10 transition-all flex items-center justify-between group/btn">
                 "Що зробити сьогодні?"
                 <ArrowRight className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
             </button>
         </div>
    </div>
  );
}
