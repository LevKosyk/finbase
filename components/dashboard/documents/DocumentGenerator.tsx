"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics-client";
import { createTemplateVersion, getDocumentHistory, getDocumentTemplates } from "@/app/actions/document-workflow";
import { useEffect } from "react";
import dynamic from "next/dynamic";

const DocumentPreviewBlock = dynamic(() => import("@/components/dashboard/documents/DocumentPreviewBlock"), {
  loading: () => <div className="h-[180px] rounded-2xl border border-gray-200 bg-gray-50 animate-pulse" />,
});

type DocType = "declaration" | "payment" | "act" | "invoice" | "rakhunok";
type DocFormat = "pdf" | "json";

interface Props {
  defaultFrom: string;
  defaultTo: string;
}

const documentOptions: Array<{ id: DocType; label: string }> = [
  { id: "declaration", label: "Декларація" },
  { id: "payment", label: "Платіжка" },
  { id: "act", label: "Акт" },
  { id: "invoice", label: "Інвойс" },
  { id: "rakhunok", label: "Рахунок" },
];

const defaultDraft = {
  type: "declaration" as DocType,
  format: "pdf" as DocFormat,
  dateFrom: "",
  dateTo: "",
  number: "",
  counterparty: "",
  counterpartyTaxId: "",
  description: "",
  amount: "",
  currency: "UAH",
  selectedTemplateId: "",
};

function normalizeDraft(value: unknown = {}) {
  const source: Partial<typeof defaultDraft> =
    value && typeof value === "object" ? (value as Partial<typeof defaultDraft>) : {};
  return {
    ...defaultDraft,
    ...source,
    type: (source?.type ?? defaultDraft.type) as DocType,
    format: (source?.format ?? defaultDraft.format) as DocFormat,
  };
}

export default function DocumentGenerator(props: Partial<Props>) {
  const defaultFrom = props?.defaultFrom || "";
  const defaultTo = props?.defaultTo || "";
  const [isLoading, setIsLoading] = useState(false);
  const [draftState, setDraftState] = useState<Partial<typeof defaultDraft>>(() =>
    normalizeDraft({
      dateFrom: defaultFrom || "",
      dateTo: defaultTo || "",
    })
  );
  const draft = normalizeDraft(draftState);
  const setDraft = (patch?: Partial<typeof defaultDraft>) => {
    const nextPatch = patch || {};
    setDraftState((prev) => ({
      ...defaultDraft,
      ...(prev || {}),
      ...Object.fromEntries(Object.entries(nextPatch).filter(([, value]) => value !== undefined)),
    }));
  };
  const [errors, setErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<Record<string, string | number>[] | null>(null);
  const [templates, setTemplates] = useState<Array<{ id: string; type: string; name: string; version: number }>>([]);
  const [history, setHistory] = useState<Array<{ id: string; type: string; format: string; number: string | null; payloadJson: any; createdAt: Date | string }>>([]);

  const docType: DocType = draft?.type ?? "declaration";
  const docFormat: DocFormat = draft?.format ?? "pdf";
  const needsCounterparty = useMemo(
    () => docType === "act" || docType === "invoice" || docType === "rakhunok",
    [docType]
  );

  useEffect(() => {
    (async () => {
      const tpl = await getDocumentTemplates();
      setTemplates(tpl.map((t) => ({ id: t.id, type: t.type, name: t.name, version: t.version })));
      const hist = await getDocumentHistory();
      setHistory(hist as any);
    })();
  }, []);

  useEffect(() => {
    const candidate = templates.find((t) => t.type === docType);
    if (candidate && !draft.selectedTemplateId) setDraft({ selectedTemplateId: candidate.id });
  }, [docType, draft.selectedTemplateId, templates]);

  useEffect(() => {
    if (!draft.dateFrom && defaultFrom) {
      setDraft({ dateFrom: defaultFrom });
    }
    if (!draft.dateTo && defaultTo) {
      setDraft({ dateTo: defaultTo });
    }
  }, [defaultFrom, defaultTo, draft.dateFrom, draft.dateTo]);

  async function buildPayload(extra?: { preview?: boolean; sourceGenerationId?: string }) {
    return {
      type: docType,
      format: docFormat,
      dateFrom: draft.dateFrom,
      dateTo: draft.dateTo,
      number: draft.number || undefined,
      counterparty: draft.counterparty || undefined,
      counterpartyTaxId: draft.counterpartyTaxId || undefined,
      description: draft.description || undefined,
      amount: draft.amount ? Number(draft.amount) : undefined,
      currency: draft.currency,
      templateId: draft.selectedTemplateId || undefined,
      preview: extra?.preview,
      sourceGenerationId: extra?.sourceGenerationId,
    };
  }

  async function handleExport() {
    setIsLoading(true);
    setErrors([]);
    trackEvent("document_export_started", { doc_type: docType, doc_format: docFormat });
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(await buildPayload()),
      });

      if (!response.ok) {
        const data = await response.json();
        trackEvent("document_export_failed", { doc_type: docType, doc_format: docFormat, reason: data?.error || "export_failed" });
        if (data?.missing) {
          setErrors(data.missing as string[]);
        } else {
          setErrors([data?.error || "Помилка генерації документу"]);
        }
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ext = docFormat === "pdf" ? "pdf" : "json";
      a.href = url;
      a.download = `document-${docType}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      trackEvent("document_export_success", { doc_type: docType, doc_format: docFormat });
      setHistory(await getDocumentHistory() as any);
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePreview() {
    setErrors([]);
    setPreview(null);
    const response = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(await buildPayload({ preview: true })),
    });
    const data = await response.json();
    if (!response.ok) {
      if (data?.missing) setErrors(data.missing as string[]);
      else setErrors([data?.error || "Помилка превʼю"]);
      return;
    }
    setPreview(data.preview || []);
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Генератор документів</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Автозаповнення реквізитів ФОП та експорт у файл.</p>
      </div>

      {errors.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-700 mb-2">Заповніть обов&apos;язкові поля:</p>
          <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 p-4 md:p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Параметри документа</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Тип документу</label>
            <select
              value={docType}
              onChange={(e) => setDraft({ type: e.target.value as DocType, selectedTemplateId: "" })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            >
              {documentOptions.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Формат</label>
            <select
              value={docFormat}
              onChange={(e) => setDraft({ format: e.target.value as DocFormat })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            >
              <option value="pdf">PDF</option>
              <option value="json">JSON</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Шаблон</label>
            <select
              value={draft.selectedTemplateId}
              onChange={(e) => setDraft({ selectedTemplateId: e.target.value })}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            >
              {templates.filter((t) => t.type === docType).map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} (v{tpl.version})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={async () => {
                if (!draft.selectedTemplateId) return;
                const res = await createTemplateVersion({ templateId: draft.selectedTemplateId });
                if (res.success) {
                  const tpl = await getDocumentTemplates();
                  setTemplates(tpl.map((t) => ({ id: t.id, type: t.type, name: t.name, version: t.version })));
                }
              }}
            >
              Нова версія шаблону
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 p-4 md:p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">Реквізити</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Період від</label>
            <input type="date" value={draft.dateFrom} onChange={(e) => setDraft({ dateFrom: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Період до</label>
            <input type="date" value={draft.dateTo} onChange={(e) => setDraft({ dateTo: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Номер</label>
            <input value={draft.number} onChange={(e) => setDraft({ number: e.target.value })} placeholder="DOC-001" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Сума</label>
            <input value={draft.amount} onChange={(e) => setDraft({ amount: e.target.value })} type="number" placeholder="0.00" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Валюта</label>
            <input value={draft.currency} onChange={(e) => setDraft({ currency: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
          </div>
        </div>

        {needsCounterparty && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Контрагент</label>
              <input value={draft.counterparty} onChange={(e) => setDraft({ counterparty: e.target.value })} placeholder="Назва компанії/ПІБ" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">ІПН контрагента</label>
              <input value={draft.counterpartyTaxId} onChange={(e) => setDraft({ counterpartyTaxId: e.target.value })} placeholder="1234567890" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500" />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Опис</label>
          <textarea value={draft.description} onChange={(e) => setDraft({ description: e.target.value })} rows={3} placeholder="Опис послуг або товару" className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500" />
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={handlePreview}>Превʼю</Button>
        <Button onClick={handleExport} isLoading={isLoading}>
          Згенерувати документ
        </Button>
      </div>

      {preview && <DocumentPreviewBlock preview={preview} />}

      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-2">
        <p className="text-sm font-bold text-gray-800">Історія генерацій</p>
        {history.length === 0 ? (
          <p className="text-xs text-gray-600">Історія порожня.</p>
        ) : (
          history.map((item) => (
            <div key={item.id} className="rounded-xl bg-white border border-gray-100 p-3 flex items-center justify-between gap-3">
              <div className="text-xs text-gray-700">
                {item.type} • {item.format.toUpperCase()} • {item.number || "без номера"} • {new Date(item.createdAt).toLocaleString("uk-UA")}
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  const payload = item.payloadJson || {};
                  const response = await fetch("/api/documents", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      ...payload,
                      type: item.type,
                      format: item.format,
                      sourceGenerationId: item.id,
                    }),
                  });
                  if (!response.ok) return;
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  const ext = item.format === "pdf" ? "pdf" : "json";
                  a.href = url;
                  a.download = `document-${item.type}.${ext}`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  window.URL.revokeObjectURL(url);
                  setHistory(await getDocumentHistory() as any);
                }}
              >
                Повторити експорт
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
