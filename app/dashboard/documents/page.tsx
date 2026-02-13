import DocumentGenerator from "@/components/dashboard/documents/DocumentGenerator";
import { getComplianceOverview } from "@/app/actions/compliance";

export default async function DocumentsPage() {
  const overview = await getComplianceOverview();

  if (!overview) {
    return <div className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">Заповніть налаштування ФОП, щоб генерувати документи.</div>;
  }

  const defaultFrom = overview.period.start.toISOString().slice(0, 10);
  const defaultTo = overview.period.end.toISOString().slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">Документи</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Декларація, платіжка, акт, рахунок, інвойс.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <DocumentGenerator defaultFrom={defaultFrom} defaultTo={defaultTo} />
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Чеклист перед ДПС</h2>
            <div className="space-y-2">
              {overview.checklist.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800 px-3 py-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.title}</span>
                  <span className={`text-xs font-bold ${item.done ? "text-green-600" : "text-amber-600"}`}>
                    {item.done ? "OK" : "Потрібно"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Податкові попередження</h2>
            {overview.taxWarnings.length === 0 ? (
              <p className="text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2">Критичних попереджень немає.</p>
            ) : (
              <ul className="space-y-2">
                {overview.taxWarnings.map((warning) => (
                  <li key={warning} className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-3 py-2">{warning}</li>
                ))}
              </ul>
            )}
          </div>

          {overview.missingFields.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-red-100 dark:border-red-800/40 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">Не заповнені реквізити</h2>
              <ul className="space-y-2">
                {overview.missingFields.map((field) => (
                  <li key={field} className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2">{field}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
