import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/rbac";
import { runRlsAudit } from "@/lib/rls-audit";

export default async function AdminRlsAuditPage() {
  const auth = await requireAdmin();
  if (!auth.ok) redirect("/dashboard");

  const report = await runRlsAudit();

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">RLS Audit</h1>
        <p className="text-gray-600 dark:text-gray-300">Перевірка таблиць/policies у public schema.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-3"><p className="text-xs text-gray-500">Усього таблиць</p><p className="font-bold">{report.summary.totalTables}</p></div>
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/30 p-3"><p className="text-xs text-blue-600">RLS увімкнено</p><p className="font-bold">{report.summary.tablesWithRls}</p></div>
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/30 p-3"><p className="text-xs text-emerald-600">Є policies</p><p className="font-bold">{report.summary.tablesWithPolicies}</p></div>
        <div className="rounded-xl bg-red-50 dark:bg-red-900/30 p-3"><p className="text-xs text-red-600">High risk</p><p className="font-bold">{report.summary.highRisk}</p></div>
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/30 p-3"><p className="text-xs text-amber-600">Medium risk</p><p className="font-bold">{report.summary.mediumRisk}</p></div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-2 text-left text-xs text-gray-500">Table</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">RLS</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">Policies</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">auth.uid()</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">Risk</th>
            </tr>
          </thead>
          <tbody>
            {report.tables.map((row) => (
              <tr key={row.table} className="border-t border-gray-100 dark:border-gray-700">
                <td className="px-4 py-2 text-xs font-semibold text-gray-900 dark:text-gray-100">{row.table}</td>
                <td className="px-4 py-2 text-xs text-gray-700 dark:text-gray-300">{row.rlsEnabled ? "on" : "off"}</td>
                <td className="px-4 py-2 text-xs text-gray-700 dark:text-gray-300">{row.policyCount}</td>
                <td className="px-4 py-2 text-xs text-gray-700 dark:text-gray-300">{row.hasAuthUidPolicy ? "yes" : "no"}</td>
                <td className={`px-4 py-2 text-xs font-bold ${row.risk === "high" ? "text-red-600" : row.risk === "medium" ? "text-amber-600" : "text-emerald-600"}`}>{row.risk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
