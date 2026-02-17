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

export default function DocumentGenerator({ defaultFrom, defaultTo }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [type, setType] = useState<DocType>("declaration");
  const [format, setFormat] = useState<DocFormat>("pdf");
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const [number, setNumber] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [counterpartyTaxId, setCounterpartyTaxId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("UAH");
  const [errors, setErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<Record<string, string | number>[] | null>(null);
  const [templates, setTemplates] = useState<Array<{ id: string; type: string; name: string; version: number }>>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [history, setHistory] = useState<Array<{ id: string; type: string; format: string; number: string | null; payloadJson: any; createdAt: Date | string }>>([]);

  const needsCounterparty = useMemo(
    () => type === "act" || type === "invoice" || type === "rakhunok",
    [type]
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
    const candidate = templates.find((t) => t.type === type);
    if (candidate) setSelectedTemplateId(candidate.id);
  }, [type, templates]);

  async function buildPayload(extra?: { preview?: boolean; sourceGenerationId?: string }) {
    return {
      type,
      format,
      dateFrom,
      dateTo,
      number: number || undefined,
      counterparty: counterparty || undefined,
      counterpartyTaxId: counterpartyTaxId || undefined,
      description: description || undefined,
      amount: amount ? Number(amount) : undefined,
      currency,
      templateId: selectedTemplateId || undefined,
      preview: extra?.preview,
      sourceGenerationId: extra?.sourceGenerationId,
    };
  }

  async function handleExport() {
    setIsLoading(true);
    setErrors([]);
    trackEvent("document_export_started", { doc_type: type, doc_format: format });
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(await buildPayload()),
      });

      if (!response.ok) {
        const data = await response.json();
        trackEvent("document_export_failed", { doc_type: type, doc_format: format, reason: data?.error || "export_failed" });
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
      const ext = format === "pdf" ? "pdf" : "json";
      a.href = url;
      a.download = `document-${type}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      trackEvent("document_export_success", { doc_type: type, doc_format: format });
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
    <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm p-6 md:p-8 space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Тип документу</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as DocType)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          >
            {documentOptions.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Формат</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as DocFormat)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          >
            <option value="pdf">PDF</option>
            <option value="json">JSON</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Шаблон</label>
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          >
            {templates.filter((t) => t.type === type).map((tpl) => (
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
              if (!selectedTemplateId) return;
              const res = await createTemplateVersion({ templateId: selectedTemplateId });
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Період від</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Період до</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Номер</label>
          <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="DOC-001" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Сума</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="0.00" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Валюта</label>
          <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100" />
        </div>
      </div>

      {needsCounterparty && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Контрагент</label>
            <input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="Назва компанії/ПІБ" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">ІПН контрагента</label>
            <input value={counterpartyTaxId} onChange={(e) => setCounterpartyTaxId(e.target.value)} placeholder="1234567890" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Опис</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Опис послуг або товару" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder:text-gray-500" />
      </div>

      <div className="flex gap-2">
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
            <div key={item.id} className="rounded-xl bg-white p-3 flex items-center justify-between gap-3">
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
