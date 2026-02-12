
import { getIncomes, getIncomeStats } from "@/app/actions/income";
import IncomeList from "@/components/dashboard/IncomeList";
import IncomeStats from "@/components/dashboard/income/IncomeStats";
import IncomeFilters from "@/components/dashboard/income/IncomeFilters";
import AddIncomeModal from "@/components/dashboard/income/AddIncomeModal";
import AIHelperBlock from "@/components/dashboard/income/AIHelperBlock";
import IncomeExport from "@/components/dashboard/income/IncomeExport";
import IncomeImport from "@/components/dashboard/income/IncomeImport";

export default async function IncomePage({
    searchParams,
  }: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
  }) {
    const resolvedSearchParams = await searchParams;
    const q = typeof resolvedSearchParams?.q === 'string' ? resolvedSearchParams.q : undefined;
    const type = typeof resolvedSearchParams?.type === 'string' ? resolvedSearchParams.type : undefined;
    const startDate = typeof resolvedSearchParams?.startDate === 'string' ? resolvedSearchParams.startDate : undefined;
    const endDate = typeof resolvedSearchParams?.endDate === 'string' ? resolvedSearchParams.endDate : undefined;
    const minAmount = typeof resolvedSearchParams?.minAmount === 'string' ? resolvedSearchParams.minAmount : undefined;
    const maxAmount = typeof resolvedSearchParams?.maxAmount === 'string' ? resolvedSearchParams.maxAmount : undefined;
    
    // Fetch data in parallel
    const [incomes, stats] = await Promise.all([
        getIncomes({ q, type, startDate, endDate, minAmount, maxAmount }),
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
            <IncomeExport />
            <IncomeImport />
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
