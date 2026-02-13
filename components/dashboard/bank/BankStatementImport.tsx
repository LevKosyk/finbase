"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { importBankStatement } from "@/app/actions/bank";
import type { BankStatementRow } from "@/lib/types/bank";
import { useRouter } from "next/navigation";

const headerMap: Record<string, keyof BankStatementRow> = {
  date: "date",
  дата: "date",
  operation_date: "date",
  amount: "amount",
  сума: "amount",
  credit: "amount",
  debit: "amount",
  description: "description",
  опис: "description",
  details: "description",
  counterparty: "counterparty",
  контрагент: "counterparty",
  recipient: "counterparty",
  sender: "counterparty",
  currency: "currency",
  валюта: "currency",
  direction: "direction",
  тип: "direction",
};

function parseDirection(value: string): "income" | "expense" | "" {
  const v = value.toLowerCase();
  if (/(income|credit|надход|in)/.test(v)) return "income";
  if (/(expense|debit|витрат|out|списан)/.test(v)) return "expense";
  return "";
}

function normalizeNumber(value: string) {
  const cleaned = value.replace(/\s/g, "").replace(",", ".");
  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : NaN;
}

export default function BankStatementImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<{
    totalRows: number;
    importedIncome: number;
    importedExpense: number;
    duplicates: number;
    skipped: number;
  } | null>(null);
  const [error, setError] = useState("");

  const mapRows = (rows: Record<string, unknown>[]) => {
    return rows.map((row) => {
      const mapped: Partial<Record<keyof BankStatementRow, string>> = {};
      Object.entries(row).forEach(([key, value]) => {
        const normalized = key.trim().toLowerCase();
        const target = headerMap[normalized];
        if (!target) return;
        mapped[target] = String(value ?? "").trim();
      });
      return {
        date: mapped.date || "",
        amount: normalizeNumber(mapped.amount || "NaN"),
        description: mapped.description || "",
        counterparty: mapped.counterparty || "",
        currency: mapped.currency || "",
        direction: parseDirection(mapped.direction || ""),
      } as BankStatementRow;
    });
  };

  const handleParsedRows = async (rows: BankStatementRow[], fileName: string) => {
    const res = await importBankStatement(rows, fileName);
    if (!res.success) {
      setError(res.error || "Помилка імпорту");
      return;
    }
    setError("");
    setReport({
      totalRows: res.totalRows ?? 0,
      importedIncome: res.importedIncome ?? 0,
      importedExpense: res.importedExpense ?? 0,
      duplicates: res.duplicates ?? 0,
      skipped: res.skipped ?? 0,
    });
    router.refresh();
  };

  const handleFile = async (file: File) => {
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const lower = file.name.toLowerCase();
      if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
        await handleParsedRows(mapRows(rows), file.name);
      } else {
        await new Promise<void>((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
              try {
                const rows = mapRows(results.data as Record<string, unknown>[]);
                await handleParsedRows(rows, file.name);
                resolve();
              } catch (e) {
                reject(e);
              }
            },
            error: () => reject(new Error("CSV parse error")),
          });
        });
      }
    } catch {
      setError("Не вдалося обробити виписку");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Імпорт банківської виписки</h2>
        <p className="text-gray-500 mt-1">CSV/XLSX імпорт, авторазбір у доходи/витрати, детект дублювань.</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <Button onClick={() => inputRef.current?.click()} isLoading={loading} leftIcon={<UploadCloud className="w-5 h-5" />}>
        Завантажити виписку
      </Button>

      {error && <div className="rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">{error}</div>}

      {report && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">Рядків</p><p className="font-bold">{report.totalRows}</p></div>
          <div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs text-emerald-600">Дохід</p><p className="font-bold">{report.importedIncome}</p></div>
          <div className="rounded-xl bg-blue-50 p-3"><p className="text-xs text-blue-600">Витрати</p><p className="font-bold">{report.importedExpense}</p></div>
          <div className="rounded-xl bg-amber-50 p-3"><p className="text-xs text-amber-600">Дублі</p><p className="font-bold">{report.duplicates}</p></div>
          <div className="rounded-xl bg-red-50 p-3"><p className="text-xs text-red-600">Пропущено</p><p className="font-bold">{report.skipped}</p></div>
        </div>
      )}
    </div>
  );
}
