"use client";

import { useUI } from "@/components/providers/UIProvider";
import AIHelper from "@/components/AIHelper";
import { Button } from "@/components/ui/Button";
import { Bot } from "lucide-react";

export default function GlobalAI() {
  const { isAIHelperOpen, openAIHelper, closeAIHelper } = useUI();

  return (
    <>
      <AIHelper isOpen={isAIHelperOpen} onClose={closeAIHelper} />
      
      <Button
        onClick={openAIHelper}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 h-auto bg-[var(--fin-primary)] text-white rounded-full shadow-xl shadow-blue-500/30 hover:bg-[var(--fin-secondary)] hover:scale-105 transition-all duration-300 group"
      >
        <div className="relative">
           <div className="absolute inset-0 bg-white blur-md opacity-20 rounded-full animate-pulse"></div>
           <Bot className="w-6 h-6 relative z-10" />
        </div>
        <span className="font-semibold pr-1 hidden sm:inline">AI-помічник</span>
      </Button>
    </>
  );
}
