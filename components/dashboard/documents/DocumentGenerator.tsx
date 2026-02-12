"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";

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

  const needsCounterparty = useMemo(
    () => type === "act" || type === "invoice" || type === "rakhunok",
    [type]
  );

  async function handleExport() {
    setIsLoading(true);
    setErrors([]);
    try {
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
      });

      if (!response.ok) {
        const data = await response.json();
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
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Генератор документів</h2>
        <p className="text-gray-500 mt-1">Автозаповнення реквізитів ФОП та експорт у файл.</p>
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
          <label className="text-sm font-semibold text-gray-700">Тип документу</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as DocType)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
          >
            {documentOptions.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Формат</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as DocFormat)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
          >
            <option value="pdf">PDF</option>
            <option value="json">JSON</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Період від</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Період до</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Номер</label>
          <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="DOC-001" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Сума</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="0.00" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Валюта</label>
          <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3" />
        </div>
      </div>

      {needsCounterparty && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Контрагент</label>
            <input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder="Назва компанії/ПІБ" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">ІПН контрагента</label>
            <input value={counterpartyTaxId} onChange={(e) => setCounterpartyTaxId(e.target.value)} placeholder="1234567890" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3" />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700">Опис</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Опис послуг або товару" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3" />
      </div>

      <Button onClick={handleExport} isLoading={isLoading}>
        Згенерувати документ
      </Button>
    </div>
  );
}
