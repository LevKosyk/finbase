import { getDashboardStats } from "@/app/actions/dashboard";
import SummaryCards from "@/components/dashboard/SummaryCards";
import FinancialChart from "@/components/dashboard/FinancialChart";

import AIWidget from "@/components/dashboard/AIWidget";
import TaxStatusBlock from "@/components/dashboard/TaxStatusBlock";
import PremiumBlock from "@/components/dashboard/PremiumBlock";
import { getUser } from "@/app/actions/auth";
import MotionWrapper from "@/components/MotionWrapper";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const user = await getUser();

  if (!stats) return <div>Loading...</div>;

  const firstName = user?.firstName || user?.name || "User";

  return (
    <div className="pb-12 space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex justify-between items-end">
         <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Вітаємо, {firstName} 👋
            </h1>
            <p className="text-gray-500 mt-2 font-medium">Ось ваша фінансова картина на сьогодні.</p>
         </div>
         <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Сьогодні</p>
            <p className="text-lg font-bold text-gray-900">{new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
         </div>
      </div>

      {/* 1. Top Summary Cards */}
      <SummaryCards stats={stats} />

      {/* 2. Main Grid: Chart vs Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Financial Chart (2/3) */}
          <FinancialChart data={stats.income.history} />
          


          {/* Right: Widgets (1/3) */}
          <div className="flex flex-col gap-6">
              <div className="h-[200px]">
                  <TaxStatusBlock stats={stats} />
              </div>
              <div className="h-[300px]">
                  <PremiumBlock />
              </div>
              <div className="h-[240px]">
                  <AIWidget />
              </div>
          </div>
      </div>

      {/* 3. Bottom Row: Tasks (Removed per user request) */}


    </div>
  );
}
