"use client";

import { Sparkles, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useUI } from "@/components/providers/UIProvider";

export default function AIWidget() {
  const { openAIHelper } = useUI();
  return (
    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[32px] p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden h-full flex flex-col justify-between group hover:shadow-2xl transition-all duration-300">
         {/* Decorative elements */}
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:bg-white/30 transition-colors duration-500"></div>
         <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-2xl -ml-5 -mb-5 pointer-events-none"></div>

         <div className="relative z-10 cursor-pointer flex items-center justify-between" onClick={() => openAIHelper()}>
             <div>
                <h3 className="text-xl font-bold mb-1">Спроси AI</h3>
                <p className="text-indigo-100 text-xs font-medium opacity-80">Ваш асистент</p>
             </div>
             <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300">
                 <Sparkles className="w-5 h-5 text-white" />
             </div>
         </div>

         <div className="relative z-10 mt-4">
             <button onClick={() => openAIHelper("Скільки податків я маю заплатити?")} className="w-full text-left px-3 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-[11px] font-semibold text-white border border-white/10 transition-all flex items-center justify-between group/btn">
                 "Скільки податків платити?"
                 <ArrowRight className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
             </button>
         </div>
    </div>
  );
}
