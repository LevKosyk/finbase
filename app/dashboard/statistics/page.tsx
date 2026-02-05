
import StatisticsFilters from "@/components/dashboard/statistics/StatisticsFilters";
import KPIGrid from "@/components/dashboard/statistics/KPIGrid";
import IncomeChart from "@/components/dashboard/statistics/IncomeChart";
import ExpenseStructure from "@/components/dashboard/statistics/ExpenseStructure";
import Loader from "@/components/ui/Loader";
import FOPLimitWidget from "@/components/dashboard/statistics/FOPLimitWidget";
import AIInsightsMock from "@/components/dashboard/statistics/AIInsightsMock";
import { getStatistics } from "@/app/actions/statistics";

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams;
  const period = (resolvedSearchParams?.period as 'month' | 'quarter' | 'year' | 'custom') || 'year';
  const from = resolvedSearchParams?.from as string | undefined;
  const to = resolvedSearchParams?.to as string | undefined;
  const stats = await getStatistics(period, from, to);

  if (!stats) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader text="Завантаження статистики..." size="lg" />
        </div>
      );
  }

  return (
    <div className="pb-12 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Глибока Аналітика</h1>
           <p className="text-gray-500 text-lg">Детальний розріз доходів та вітрат</p>
        </div>
      </div>

      <StatisticsFilters />

      {/* KPI Cards */}
      <KPIGrid stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Main Income Chart */}
         <div className="lg:col-span-2">
            <IncomeChart data={stats.charts.incomeDynamics} />
         </div>

         {/* Right Column: AI & FOP */}
         <div className="flex flex-col gap-6">
            <div className="flex-1">
                 <AIInsightsMock insights={stats.insights} />
            </div>
         </div>
      </div>
      
      {/* Bottom Row: Expense Structure & FOP Limit */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
             <ExpenseStructure data={stats.charts.expenseStructure} />
          </div>
          <div className="lg:col-span-2">
             <FOPLimitWidget stats={stats.fop.limit} />
          </div>
       </div>

    </div>
  );
}
