"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import { useUI } from "@/components/providers/UIProvider";

export default function AIWidget() {
  const { openAIHelper } = useUI();
  return (
    <div className="bg-linear-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-sm h-full flex flex-col justify-between min-h-45">
         <div className="cursor-pointer flex items-center justify-between" onClick={() => openAIHelper()}>
             <div>
                <h3 className="text-sm font-bold mb-0.5">AI\u2011асистент</h3>
                <p className="text-indigo-200 text-[11px] font-medium">Поради по доходах, витратах і податках</p>
             </div>
             <div className="w-9 h-9 bg-white/15 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                 <Sparkles className="w-4 h-4 text-white" />
             </div>
         </div>

         <div className="mt-4 space-y-2">
             <button onClick={() => openAIHelper("Скільки податків я маю заплатити?")} className="w-full text-left px-3 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-[11px] font-semibold text-white border border-white/10 transition-all flex items-center justify-between group/btn">
                 &ldquo;Скільки податків платити?&rdquo;
                 <ArrowRight className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
             </button>
             <button onClick={() => openAIHelper("Що треба зробити сьогодні по ФОП?")} className="w-full text-left px-3 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-[11px] font-semibold text-white border border-white/10 transition-all flex items-center justify-between group/btn">
                 &ldquo;Що зробити сьогодні?&rdquo;
                 <ArrowRight className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
             </button>
         </div>
    </div>
  );
}
