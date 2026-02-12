import RulesManager from "@/components/dashboard/rules/RulesManager";
import { getCategorizationRules } from "@/app/actions/categorization-rules";

export default async function RulesPage() {
  const rules = await getCategorizationRules();

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Правила категоризації</h1>
        <p className="text-gray-500 text-lg">Автокатегорія за ключовими словами і контрагентом.</p>
      </div>

      <RulesManager initialRules={rules} />
    </div>
  );
}
