import BankStatementImport from "@/components/dashboard/bank/BankStatementImport";
import { getStatementImports } from "@/app/actions/bank";

export default async function BankPage() {
  const imports = await getStatementImports();

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Банківська виписка</h1>
        <p className="text-gray-500 text-lg">Імпорт та автоматичний розбір транзакцій.</p>
      </div>

      <BankStatementImport />

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Історія імпортів</h2>
        {imports.length === 0 ? (
          <p className="text-gray-500">Імпортів поки немає.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500">
                  <th className="py-2 pr-4">Дата</th>
                  <th className="py-2 pr-4">Файл</th>
                  <th className="py-2 pr-4">Рядків</th>
                  <th className="py-2 pr-4">Дохід</th>
                  <th className="py-2 pr-4">Витрати</th>
                  <th className="py-2 pr-4">Дублі</th>
                  <th className="py-2 pr-4">Пропущено</th>
                </tr>
              </thead>
              <tbody>
                {imports.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100 text-sm">
                    <td className="py-3 pr-4">{new Date(item.createdAt).toLocaleString("uk-UA")}</td>
                    <td className="py-3 pr-4 font-semibold">{item.fileName}</td>
                    <td className="py-3 pr-4">{item.totalRows}</td>
                    <td className="py-3 pr-4 text-emerald-700 font-semibold">{item.importedIncome}</td>
                    <td className="py-3 pr-4 text-blue-700 font-semibold">{item.importedExpense}</td>
                    <td className="py-3 pr-4 text-amber-700 font-semibold">{item.duplicateRows}</td>
                    <td className="py-3 pr-4 text-red-700 font-semibold">{item.skippedRows}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
