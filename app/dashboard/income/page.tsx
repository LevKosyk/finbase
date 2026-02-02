
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getIncomes, getIncomeStats } from "@/app/actions/income";
import IncomeList from "@/components/dashboard/IncomeList";
import IncomeStats from "@/components/dashboard/income/IncomeStats";
import IncomeFilters from "@/components/dashboard/income/IncomeFilters";
import AddIncomeModal from "@/components/dashboard/income/AddIncomeModal";
import AIHelperBlock from "@/components/dashboard/income/AIHelperBlock";

export default async function IncomePage({
    searchParams,
  }: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
  }) {
    const resolvedSearchParams = await searchParams;
    const q = typeof resolvedSearchParams?.q === 'string' ? resolvedSearchParams.q : undefined;
    
    // Fetch data in parallel
    const [incomes, stats] = await Promise.all([
        getIncomes({ q }),
        getIncomeStats()
    ]);

  return (
    <div className="pb-12 max-w-6xl mx-auto">
      {/* Header with improved layout */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
           <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Облік доходів</h1>
           <p className="text-gray-500 text-lg">Всі ваші фінансові надходження під контролем</p>
        </div>
        <div className="flex gap-3">
            <Button 
                variant="secondary"
                className="font-bold border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm text-gray-700 bg-white"
                leftIcon={<Download className="w-5 h-5" />}
            >
                <span className="hidden sm:inline">Експорт</span>
            </Button>
            
            <AddIncomeModal />
        </div>
      </div>

      <IncomeStats stats={stats} />
      
      <AIHelperBlock />

      <IncomeFilters />

      {/* Main Content Card */}
      <IncomeList initialIncomes={incomes} />
    </div>
  );
}
