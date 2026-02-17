import RulesManager from "@/components/dashboard/rules/RulesManager";
import { getCategorizationRules } from "@/app/actions/categorization-rules";
import DataState from "@/components/ui/DataState";
import { isFeatureEnabled } from "@/lib/feature-flags";

export default async function RulesPage() {
  const enabled = await isFeatureEnabled("categorization_rules");
  if (!enabled) {
    return (
      <div className="max-w-7xl mx-auto pb-12">
        <DataState
          variant="empty"
          title="Модуль правил категоризації вимкнено"
          description="Адміністратор тимчасово вимкнув цей модуль через feature flag."
        />
      </div>
    );
  }

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
