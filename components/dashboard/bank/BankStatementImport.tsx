"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { importBankStatement, previewBankStatement } from "@/app/actions/bank";
import type { BankStatementRow } from "@/lib/types/bank";
import { trackEvent } from "@/lib/analytics-client";
import { useSWRConfig } from "swr";
import { queueDashboardRevalidateByPriority } from "@/lib/dashboard-swr";

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

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_ROWS = 10000;
const MAX_COLUMNS = 40;

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
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false);
  const [queueJobId, setQueueJobId] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [pendingRows, setPendingRows] = useState<BankStatementRow[]>([]);
  const [pendingFileName, setPendingFileName] = useState("");
  const [report, setReport] = useState<{
    totalRows: number;
    importedIncome: number;
    importedExpense: number;
    duplicates: number;
    skipped: number;
  } | null>(null);
  const [preview, setPreview] = useState<{
    totalRows: number;
    previewedRows: number;
    skipped: number;
    incomeCount: number;
    expenseCount: number;
    changedByRules: number;
    previewRows: Array<{
      date: string;
      direction: "income" | "expense";
      amount: number;
      counterparty: string;
      description: string;
      beforeCategory: string;
      afterCategory: string;
      ruleApplied: boolean;
    }>;
  } | null>(null);
  const [error, setError] = useState("");

  const mapRows = (rows: Record<string, unknown>[]) => {
    return rows.slice(0, MAX_ROWS).map((row) => {
      const mapped: Partial<Record<keyof BankStatementRow, string>> = {};
      Object.entries(row).slice(0, MAX_COLUMNS).forEach(([key, value]) => {
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

  const handleImport = async () => {
    if (pendingRows.length === 0 || !pendingFileName) return;
    setLoading(true);
    try {
      const idemKey = crypto.randomUUID();
      const queueRes = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "bank_import",
          idempotencyKey: idemKey,
          payload: {
            rows: pendingRows,
            fileName: pendingFileName,
            idempotencyKey: idemKey,
          },
        }),
      });

      if (!queueRes.ok) {
        const res = await importBankStatement(pendingRows, pendingFileName, idemKey);
        if (!res.success) {
          trackEvent("bank_import_failed", { reason: res.error || "import_failed", file_name: pendingFileName });
          setError(res.error || "Помилка імпорту");
          return;
        }
        trackEvent("bank_import_success", {
          file_name: pendingFileName,
          total_rows: res.totalRows ?? 0,
          imported_income: res.importedIncome ?? 0,
          imported_expense: res.importedExpense ?? 0,
          duplicates: res.duplicates ?? 0,
          skipped: res.skipped ?? 0,
        });
        setError("");
        setReport({
          totalRows: res.totalRows ?? 0,
          importedIncome: res.importedIncome ?? 0,
          importedExpense: res.importedExpense ?? 0,
          duplicates: res.duplicates ?? 0,
          skipped: res.skipped ?? 0,
        });
        setPendingRows([]);
        setPendingFileName("");
        setPreview(null);
        queueDashboardRevalidateByPriority(mutate, { immediate: ["bank-imports", "income", "expenses"], deferred: ["statistics"] });
        return;
      }

      const queueJson = await queueRes.json();
      const jobId = String(queueJson?.jobId || "");
      if (!jobId) {
        setError("Не вдалося поставити імпорт у чергу");
        return;
      }
      setQueueJobId(jobId);

      const started = Date.now();
      while (Date.now() - started < 5 * 60 * 1000) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const statusRes = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
        if (!statusRes.ok) continue;
        const statusJson = await statusRes.json();
        if (statusJson?.status === "completed") {
          const result = statusJson?.result || {};
          trackEvent("bank_import_success", {
            file_name: pendingFileName,
            total_rows: result.totalRows ?? pendingRows.length,
            imported_income: result.importedIncome ?? 0,
            imported_expense: result.importedExpense ?? 0,
            duplicates: result.duplicates ?? 0,
            skipped: result.skipped ?? 0,
          });
          setError("");
          setReport({
            totalRows: Number(result.totalRows || pendingRows.length),
            importedIncome: Number(result.importedIncome || 0),
            importedExpense: Number(result.importedExpense || 0),
            duplicates: Number(result.duplicates || 0),
            skipped: Number(result.skipped || 0),
          });
          setPendingRows([]);
          setPendingFileName("");
          setPreview(null);
          setQueueJobId("");
          queueDashboardRevalidateByPriority(mutate, { immediate: ["bank-imports", "income", "expenses"], deferred: ["statistics"] });
          return;
        }
        if (statusJson?.status === "failed") {
          trackEvent("bank_import_failed", { reason: statusJson?.error || "queue_failed", file_name: pendingFileName });
          setError(statusJson?.error || "Імпорт у черзі завершився помилкою");
          setQueueJobId("");
          return;
        }
      }

      setError("Імпорт ще обробляється у фоні. Перевірте статус пізніше.");
    } finally {
      setLoading(false);
    }
  };

  const runPreview = async (rows: BankStatementRow[]) => {
    setPreviewLoading(true);
    setError("");
    try {
      const res = await previewBankStatement(rows);
      if (!res.success) {
        setError(res.error || "Помилка dry-run");
        setPreview(null);
        return;
      }
      setPreview({
        totalRows: res.totalRows ?? 0,
        previewedRows: res.previewedRows ?? 0,
        skipped: res.skipped ?? 0,
        incomeCount: res.incomeCount ?? 0,
        expenseCount: res.expenseCount ?? 0,
        changedByRules: res.changedByRules ?? 0,
        previewRows: res.previewRows ?? [],
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleFile = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setError("Файл завеликий. Максимум 10MB.");
      return;
    }
    const lowerName = file.name.toLowerCase();
    if (!(lowerName.endsWith(".csv") || lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls"))) {
      setError("Непідтримуваний формат файлу");
      return;
    }
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || "");
          const comma = result.indexOf(",");
          if (comma === -1) return reject(new Error("Invalid file data"));
          resolve(result.slice(comma + 1));
        };
        reader.onerror = () => reject(new Error("read_failed"));
        reader.readAsDataURL(file);
      });
      const scan = await fetch("/api/security/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          base64,
        }),
      });
      if (!scan.ok) {
        setError("Файл не пройшов перевірку безпеки");
        return;
      }
      const scanJson = await scan.json();
      if (scanJson?.infected) {
        setError("Виявлено потенційно небезпечний файл");
        return;
      }
    } catch {
      setError("Не вдалося перевірити файл");
      return;
    }

    trackEvent("bank_import_started", { file_name: file.name });
    setLoading(true);
    setError("");
    setReport(null);
    setPreview(null);
    try {
      const lower = file.name.toLowerCase();
      if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
        const mapped = mapRows(rows);
        setPendingRows(mapped);
        setPendingFileName(file.name);
        await runPreview(mapped);
      } else {
        await new Promise<void>((resolve, reject) => {
          Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
              try {
                const rows = mapRows(results.data as Record<string, unknown>[]);
                setPendingRows(rows);
                setPendingFileName(file.name);
                await runPreview(rows);
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
      trackEvent("bank_import_failed", { reason: "file_parse_error", file_name: file.name });
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

      {pendingRows.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" isLoading={previewLoading} onClick={() => runPreview(pendingRows)}>
            Прогнати dry-run (100 транзакцій)
          </Button>
          <Button isLoading={loading} onClick={handleImport}>
            Імпортувати після dry-run
          </Button>
        </div>
      )}

      {queueJobId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Імпорт обробляється у фоні. Job ID: <span className="font-mono">{queueJobId}</span>
        </div>
      )}

      {error && <div className="rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm font-medium">{error}</div>}

      {preview && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="rounded-xl bg-gray-50 p-3"><p className="text-xs text-gray-500">У файлі</p><p className="font-bold">{preview.totalRows}</p></div>
            <div className="rounded-xl bg-blue-50 p-3"><p className="text-xs text-blue-600">Перевірено</p><p className="font-bold">{preview.previewedRows}</p></div>
            <div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs text-emerald-600">Доходи</p><p className="font-bold">{preview.incomeCount}</p></div>
            <div className="rounded-xl bg-orange-50 p-3"><p className="text-xs text-orange-600">Витрати</p><p className="font-bold">{preview.expenseCount}</p></div>
            <div className="rounded-xl bg-violet-50 p-3"><p className="text-xs text-violet-600">Зміни правил</p><p className="font-bold">{preview.changedByRules}</p></div>
            <div className="rounded-xl bg-red-50 p-3"><p className="text-xs text-red-600">Пропущено</p><p className="font-bold">{preview.skipped}</p></div>
          </div>

          <div className="rounded-2xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-5 bg-gray-50 px-4 py-2 text-xs font-bold text-gray-600">
              <div>Дата/сума</div>
              <div>Напрям</div>
              <div>Контрагент</div>
              <div>Категорія до</div>
              <div>Категорія після</div>
            </div>
            {preview.previewRows.slice(0, 20).map((row, index) => (
              <div key={`${row.date}-${index}`} className="grid grid-cols-5 px-4 py-2 border-t border-gray-100 text-xs">
                <div className="text-gray-700">{row.date}<div className="font-semibold">{row.amount.toFixed(2)}</div></div>
                <div className={row.direction === "income" ? "text-emerald-700" : "text-blue-700"}>{row.direction}</div>
                <div className="text-gray-700 truncate" title={`${row.counterparty} ${row.description}`}>{row.counterparty || row.description || "—"}</div>
                <div className="text-gray-600">{row.beforeCategory}</div>
                <div className={row.beforeCategory === row.afterCategory ? "text-gray-700" : "text-violet-700 font-semibold"}>{row.afterCategory}</div>
              </div>
            ))}
          </div>
        </div>
      )}

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
