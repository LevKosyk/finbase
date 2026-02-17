import ExpenseImport from "@/components/dashboard/expenses/ExpenseImport";
import ExpenseExport from "@/components/dashboard/expenses/ExpenseExport";
import AddExpenseModal from "@/components/dashboard/expenses/AddExpenseModal";
import { getDeletedExpenses, getExpenseStats, getExpenses } from "@/app/actions/expenses";
import DataState from "@/components/ui/DataState";
import { isDynamicServerUsageError } from "@/lib/is-dynamic-server-error";
import ExpensesLiveSection from "@/components/dashboard/expenses/ExpensesLiveSection";
import ExpenseTrash from "@/components/dashboard/expenses/ExpenseTrash";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : undefined;
  const category = typeof resolvedSearchParams?.category === "string" ? resolvedSearchParams.category : undefined;
  const startDate = typeof resolvedSearchParams?.startDate === "string" ? resolvedSearchParams.startDate : undefined;
  const endDate = typeof resolvedSearchParams?.endDate === "string" ? resolvedSearchParams.endDate : undefined;
  const minAmount = typeof resolvedSearchParams?.minAmount === "string" ? resolvedSearchParams.minAmount : undefined;
  const maxAmount = typeof resolvedSearchParams?.maxAmount === "string" ? resolvedSearchParams.maxAmount : undefined;

  let expenses: Awaited<ReturnType<typeof getExpenses>> = [];
  let deletedExpenses: Awaited<ReturnType<typeof getDeletedExpenses>> = [];
  let stats: Awaited<ReturnType<typeof getExpenseStats>> = {
    total: 0,
    change: 0,
    average: 0,
    count: 0,
  };

  try {
    [expenses, stats, deletedExpenses] = await Promise.all([
      getExpenses({ q, category, startDate, endDate, minAmount, maxAmount }),
      getExpenseStats(),
      getDeletedExpenses(),
    ]);
  } catch (error) {
    if (isDynamicServerUsageError(error)) throw error;
    console.error("Expenses page error:", error);
    return (
      <div className="pb-12 max-w-6xl mx-auto">
        <DataState
          variant="error"
          title="Не вдалося завантажити витрати"
          description="Сталася помилка під час завантаження даних. Спробуйте ще раз."
        />
      </div>
    );
  }

  return (
    <div className="pb-12 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Облік витрат</h1>
          <p className="text-gray-500 text-lg">Контроль витрат для прозорої звітності</p>
        </div>
        <div className="flex gap-3">
          <ExpenseExport />
          <ExpenseImport />
          <AddExpenseModal />
        </div>
      </div>

      <ExpensesLiveSection
        initialExpenses={expenses}
        initialStats={stats}
        query={{ q, category, startDate, endDate, minAmount, maxAmount }}
      />
      <ExpenseTrash items={deletedExpenses} />
    </div>
  );
}
