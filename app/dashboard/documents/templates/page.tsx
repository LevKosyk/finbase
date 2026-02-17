import TemplateVersionsPanel from "@/components/dashboard/documents/TemplateVersionsPanel";
import { getDocumentTemplates } from "@/app/actions/document-workflow";

export default async function DocumentTemplatesPage() {
  const templates = await getDocumentTemplates();

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">Шаблони документів</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Версіонування та diff конфігурацій шаблонів.</p>
      </div>
      <TemplateVersionsPanel
        templates={templates.map((template) => ({
          id: template.id,
          type: template.type,
          name: template.name,
          version: template.version,
          configJson: (template.configJson || null) as Record<string, unknown> | null,
          createdAt: template.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
