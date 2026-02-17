"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { importExpenses } from "@/app/actions/expenses";
import type { ExpenseImportRow } from "@/lib/types/expenses";
import { trackEvent } from "@/lib/analytics-client";
import { useToast } from "@/components/providers/ToastProvider";
import { useSWRConfig } from "swr";

const headerMap: Record<string, keyof ExpenseImportRow> = {
  date: "date",
  дата: "date",
  amount: "amount",
  сума: "amount",
  category: "category",
  категорія: "category",
  description: "description",
  опис: "description"
};

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_ROWS = 5000;
const MAX_COLUMNS = 40;

export default function ExpenseImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { mutate } = useSWRConfig();
  const toast = useToast();

  const mapRows = (rows: Record<string, unknown>[]) => {
    return rows.slice(0, MAX_ROWS).map((row) => {
      const mapped: Partial<Record<keyof ExpenseImportRow, string>> = {};
      Object.entries(row).slice(0, MAX_COLUMNS).forEach(([key, value]) => {
        const normalized = key.trim().toLowerCase();
        const target = headerMap[normalized];
        if (target) mapped[target] = String(value ?? "").trim();
      });
      return {
        date: mapped.date,
        amount: Number(mapped.amount),
        category: mapped.category,
        description: mapped.description || ""
      } as ExpenseImportRow;
    });
  };

  const handleCsv = (file: File) => {
    trackEvent("expense_import_started", { file_name: file.name, format: "csv" });
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = mapRows(results.data as Record<string, string>[]);
        const res = await importExpenses(rows);
        if (res.success) {
          trackEvent("expense_import_success", { imported_count: res.count || 0, format: "csv" });
          toast.success({ title: "Імпорт завершено", description: `Імпортовано записів: ${res.count || 0}` });
          void mutate((key) => typeof key === "string" && (key.startsWith("/api/dashboard/expenses") || key.startsWith("/api/dashboard/statistics")));
        } else {
          trackEvent("expense_import_failed", { reason: res.error || "import_failed", format: "csv" });
          toast.error({ title: "Помилка імпорту", description: res.error || "Спробуйте ще раз." });
        }
        setIsLoading(false);
      },
      error: () => {
        setIsLoading(false);
        trackEvent("expense_import_failed", { reason: "file_parse_error", format: "csv" });
        toast.error({ title: "Не вдалося прочитати CSV" });
      }
    });
  };

  const handleXlsx = async (file: File) => {
    trackEvent("expense_import_started", { file_name: file.name, format: "xlsx" });
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const rows = mapRows(jsonRows);
      const res = await importExpenses(rows);
      if (res.success) {
        trackEvent("expense_import_success", { imported_count: res.count || 0, format: "xlsx" });
        toast.success({ title: "Імпорт завершено", description: `Імпортовано записів: ${res.count || 0}` });
        void mutate((key) => typeof key === "string" && (key.startsWith("/api/dashboard/expenses") || key.startsWith("/api/dashboard/statistics")));
      } else {
        trackEvent("expense_import_failed", { reason: res.error || "import_failed", format: "xlsx" });
        toast.error({ title: "Помилка імпорту", description: res.error || "Спробуйте ще раз." });
      }
    } catch {
      trackEvent("expense_import_failed", { reason: "file_parse_error", format: "xlsx" });
      toast.error({ title: "Не вдалося прочитати XLSX" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFile = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      toast.error({ title: "Файл завеликий", description: "Максимум 8MB" });
      return;
    }
    const nameCheck = file.name.toLowerCase();
    if (!(nameCheck.endsWith(".csv") || nameCheck.endsWith(".xlsx") || nameCheck.endsWith(".xls"))) {
      toast.error({ title: "Непідтримуваний формат", description: "Дозволено CSV/XLSX" });
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
        toast.error({ title: "Файл не пройшов перевірку безпеки" });
        return;
      }
      const scanJson = await scan.json();
      if (scanJson?.infected) {
        toast.error({ title: "Виявлено потенційно небезпечний файл" });
        return;
      }
    } catch {
      toast.error({ title: "Не вдалося перевірити файл" });
      return;
    }
    setIsLoading(true);
    const name = file.name.toLowerCase();
    if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      await handleXlsx(file);
      return;
    }
    handleCsv(file);
  };

  return (
    <>
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
      <Button
        variant="secondary"
        className="min-w-[132px]"
        leftIcon={<UploadCloud className="w-5 h-5" />}
        onClick={() => inputRef.current?.click()}
        isLoading={isLoading}
      >
        Імпорт
      </Button>
    </>
  );
}
