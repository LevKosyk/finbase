import { getDashboardStats } from "@/app/actions/dashboard";
import SummaryCards from "@/components/dashboard/SummaryCards";
import FinancialChart from "@/components/dashboard/FinancialChart";
import TaskList from "@/components/dashboard/TaskList";
import AIWidget from "@/components/dashboard/AIWidget";
import TaxStatusBlock from "@/components/dashboard/TaxStatusBlock";
import { getUser } from "@/app/actions/auth";

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
          
          {/* Right: Tax & AI (1/3) */}
          <div className="flex flex-col gap-6 h-[400px]">
              <div className="flex-1">
                  <TaxStatusBlock stats={stats} />
              </div>
              <div className="flex-1">
                  <AIWidget />
              </div>
          </div>
      </div>

      {/* 3. Bottom Row: Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TaskList />
          
           {/* Placeholder for future expansion or recent transactions list if needed */}
           <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-[24px] p-8 text-white flex items-center justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:bg-white/10 transition-colors"></div>
                <div className="relative z-10 max-w-md">
                    <h3 className="text-2xl font-bold mb-2">Все під контролем!</h3>
                    <p className="text-gray-400">Ви успішно керуєте своїми фінансами. Не забувайте додавати нові доходи.</p>
                </div>
                {/* Could add a 'Add Income' button here conceptually */}
           </div>
      </div>

    </div>
  );
}
