import ExpenseList from "@/components/dashboard/expenses/ExpenseList";
import ExpenseStats from "@/components/dashboard/expenses/ExpenseStats";
import ExpenseFilters from "@/components/dashboard/expenses/ExpenseFilters";
import ExpenseImport from "@/components/dashboard/expenses/ExpenseImport";
import ExpenseExport from "@/components/dashboard/expenses/ExpenseExport";
import AddExpenseModal from "@/components/dashboard/expenses/AddExpenseModal";
import { getExpenseStats, getExpenses } from "@/app/actions/expenses";

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

  const [expenses, stats] = await Promise.all([
    getExpenses({ q, category, startDate, endDate, minAmount, maxAmount }),
    getExpenseStats()
  ]);

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

      <ExpenseStats stats={stats} />
      <ExpenseFilters />
      <ExpenseList initialExpenses={expenses} />
    </div>
  );
}
