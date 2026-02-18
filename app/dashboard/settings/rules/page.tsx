import RulesManager from "@/components/dashboard/rules/RulesManager";
import { getCategorizationRules } from "@/app/actions/categorization-rules";
import DataState from "@/components/ui/DataState";
import { isFeatureEnabled } from "@/lib/feature-flags";

export default async function SettingsRulesPage() {
  const enabled = await isFeatureEnabled("categorization_rules");
  if (!enabled) {
    return (
      <DataState
        variant="empty"
        title="Модуль правил категоризації вимкнено"
        description="Адміністратор тимчасово вимкнув цей модуль через feature flag."
      />
    );
  }

  const rules = await getCategorizationRules();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-6">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">Правила категоризації</h2>
        <p className="text-gray-500 dark:text-gray-400">Керуйте автокатегоризацією для імпорту банківських транзакцій.</p>
      </div>

      <RulesManager initialRules={rules} />
    </div>
  );
}
