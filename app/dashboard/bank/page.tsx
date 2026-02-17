import BankStatementImport from "@/components/dashboard/bank/BankStatementImport";
import { getStatementImports } from "@/app/actions/bank";
import DataState from "@/components/ui/DataState";
import { isDynamicServerUsageError } from "@/lib/is-dynamic-server-error";
import BankImportsHistory from "@/components/dashboard/bank/BankImportsHistory";
import { isFeatureEnabled } from "@/lib/feature-flags";

export default async function BankPage() {
  const enabled = await isFeatureEnabled("bank_import");
  if (!enabled) {
    return (
      <div className="max-w-7xl mx-auto pb-12 space-y-6">
        <DataState
          variant="empty"
          title="Модуль банківських виписок вимкнено"
          description="Адміністратор тимчасово вимкнув модуль через feature flag."
        />
      </div>
    );
  }

  let imports: Awaited<ReturnType<typeof getStatementImports>> = [];
  try {
    imports = await getStatementImports();
  } catch (error) {
    if (isDynamicServerUsageError(error)) throw error;
    console.error("Bank page error:", error);
    return (
      <div className="max-w-7xl mx-auto pb-12 space-y-6">
        <DataState
          variant="error"
          title="Не вдалося завантажити банківські імпорти"
          description="Сталася помилка під час завантаження історії імпортів. Спробуйте ще раз."
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Банківська виписка</h1>
        <p className="text-gray-500 text-lg">Імпорт та автоматичний розбір транзакцій.</p>
      </div>

      <BankStatementImport />

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Історія імпортів</h2>
        <BankImportsHistory initialImports={imports} />
      </div>
    </div>
  );
}
