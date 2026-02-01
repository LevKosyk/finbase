import GreetingSection from "@/components/dashboard/GreetingSection";
import IncomeSummary from "@/components/dashboard/IncomeSummary";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
  return (
    <div className="pb-12">
      {/* 1. Greeting & Profile */}
      <GreetingSection />

      {/* 2. Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Income Chart - 2 cols */}
        <div className="lg:col-span-2 h-[400px]">
            <IncomeSummary />
        </div>
        
        {/* Recent Transactions - 1 col */}
        <div className="lg:col-span-1 h-[400px]">
            <RecentTransactions />
        </div>
      </div>

      {/* 3. Bottom Row - Reports & Plan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Reports Card */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Звітність</h3>
                    <p className="text-xs text-gray-500">Q1 2026</p>
                </div>
             </div>
             <div className="space-y-3">
                <Button 
                    variant="outline" 
                    className="w-full h-auto py-2.5 text-sm font-medium border-gray-200 hover:bg-gray-50 text-gray-900 rounded-xl"
                    leftIcon={<Plus className="w-4 h-4" />}
                >
                    Новий звіт
                </Button>
                <Button 
                    variant="primary" 
                    className="w-full h-auto py-2.5 text-sm font-medium bg-gray-900 hover:bg-gray-800 text-white shadow-none rounded-xl"
                >
                    Скачати PDF
                </Button>
             </div>
          </div>

          {/* Plan Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-white shadow-lg overflow-hidden relative">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
             <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wide">Ваш план</p>
                        <h3 className="text-2xl font-bold mt-1">Free</h3>
                    </div>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur-sm">
                        Basic
                    </span>
                </div>
                
                <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-sm text-gray-300">
                        <span>Ліміт доходів</span>
                        <span>12/50</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[24%] rounded-full"></div>
                    </div>
                </div>

                <Link href="/dashboard/plans" className="w-full block">
                    <Button 
                        variant="secondary"
                        className="w-full font-bold text-sm bg-white text-gray-900 hover:bg-gray-100 border-none shadow-lg rounded-xl h-auto py-3"
                    >
                        Отримати Pro
                    </Button>
                </Link>
             </div>
          </div>
      </div>
    </div>
  );
}
