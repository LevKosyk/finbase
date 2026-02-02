"use client";

import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Insight {
    id: string;
    title: string;
    description: string;
    type: 'growth' | 'risk' | 'neutral';
}

export default function AIInsightsMock({ insights }: { insights: Insight[] }) {
    return (
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 p-6 md:p-8 rounded-[24px] text-white shadow-lg flex flex-col h-full relative overflow-hidden group">
             {/* Background Effects */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-white/20 transition-all duration-700"></div>
             <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>

            <div className="relative z-10 flex items-center gap-3 mb-6">
                 <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
                    <Sparkles className="w-5 h-5 text-purple-200" />
                 </div>
                 <h3 className="text-lg font-bold">AI Аналітика</h3>
            </div>

            <div className="flex-1 space-y-4 relative z-10">
                {insights.map(insight => (
                    <div key={insight.id} className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-colors cursor-default">
                        <h4 className="font-bold text-sm mb-1 text-purple-100">{insight.title}</h4>
                        <p className="text-xs text-indigo-100/80 leading-relaxed">{insight.description}</p>
                    </div>
                ))}
            </div>

            <div className="mt-6 relative z-10">
                <Button 
                    variant="ghost" 
                    className="w-full bg-white text-indigo-900 hover:bg-gray-100 font-bold rounded-xl border-none shadow-lg shadow-indigo-900/20"
                    rightIcon={<ArrowRight className="w-4 h-4 ml-1" />}
                >
                    Запитати AI детальніше
                </Button>
            </div>
        </div>
    );
}
