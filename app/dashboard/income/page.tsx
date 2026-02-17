
import { getDeletedIncomes, getIncomes, getIncomeStats } from "@/app/actions/income";
import AddIncomeModal from "@/components/dashboard/income/AddIncomeModal";
import IncomeExport from "@/components/dashboard/income/IncomeExport";
import IncomeImport from "@/components/dashboard/income/IncomeImport";
import DataState from "@/components/ui/DataState";
import { isDynamicServerUsageError } from "@/lib/is-dynamic-server-error";
import IncomeLiveSection from "@/components/dashboard/income/IncomeLiveSection";
import IncomeTrash from "@/components/dashboard/income/IncomeTrash";

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
    
    let incomes: Awaited<ReturnType<typeof getIncomes>> = [];
    let deletedIncomes: Awaited<ReturnType<typeof getDeletedIncomes>> = [];
    let stats: Awaited<ReturnType<typeof getIncomeStats>> = {
      total: 0,
      change: 0,
      average: 0,
      pending: 0,
      chartData: [],
    };

    try {
      [incomes, stats, deletedIncomes] = await Promise.all([
        getIncomes({ q, type, startDate, endDate, minAmount, maxAmount }),
        getIncomeStats(),
        getDeletedIncomes(),
      ]);
    } catch (error) {
      if (isDynamicServerUsageError(error)) throw error;
      console.error("Income page error:", error);
      return (
        <div className="pb-12 max-w-6xl mx-auto">
          <DataState
            variant="error"
            title="Не вдалося завантажити доходи"
            description="Сталася помилка під час завантаження даних. Спробуйте ще раз."
          />
        </div>
      );
    }

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

      <IncomeLiveSection
        initialIncomes={incomes}
        initialStats={stats}
        query={{ q, type, startDate, endDate, minAmount, maxAmount }}
      />
      <IncomeTrash items={deletedIncomes} />
    </div>
  );
}
