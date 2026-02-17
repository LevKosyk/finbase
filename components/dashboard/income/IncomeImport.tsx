"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { importIncomes } from "@/app/actions/income";
import type { IncomeImportRow } from "@/lib/types/income";
import { trackEvent } from "@/lib/analytics-client";
import { useToast } from "@/components/providers/ToastProvider";
import { useSWRConfig } from "swr";

const headerMap: Record<string, keyof IncomeImportRow> = {
  date: "date",
  дата: "date",
  amount: "amount",
  сума: "amount",
  source: "source",
  джерело: "source",
  type: "type",
  тип: "type",
  status: "status",
  статус: "status"
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 5000;
const MAX_COLUMNS = 30;

export default function IncomeImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { mutate } = useSWRConfig();
  const toast = useToast();

  const handleFile = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      toast.error({ title: "Файл завеликий", description: "Максимум 5MB" });
      return;
    }
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".csv")) {
      toast.error({ title: "Непідтримуваний формат", description: "Дозволено лише CSV" });
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
          mimeType: file.type || "text/csv",
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

    trackEvent("income_import_started", { file_name: file.name });
    setIsLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parsedRows = (results.data as Record<string, string>[]).slice(0, MAX_ROWS);
        const rows = parsedRows.map((row) => {
          const entries = Object.entries(row).slice(0, MAX_COLUMNS);
          const mapped: Partial<Record<keyof IncomeImportRow, string>> = {};
          entries.forEach(([key, value]) => {
            const normalized = key.trim().toLowerCase();
            const target = headerMap[normalized];
            if (target) mapped[target] = String(value ?? "").trim();
          });
          return {
            date: mapped.date,
            amount: Number(mapped.amount),
            source: mapped.source,
            type: mapped.type || "other",
            status: mapped.status || "completed"
          } as IncomeImportRow;
        });

        const res = await importIncomes(rows);
        if (res.success) {
          trackEvent("income_import_success", { imported_count: res.count || 0 });
          toast.success({ title: "Імпорт завершено", description: `Імпортовано записів: ${res.count || 0}` });
          void mutate((key) => typeof key === "string" && (key.startsWith("/api/dashboard/income") || key.startsWith("/api/dashboard/statistics")));
        } else {
          trackEvent("income_import_failed", { reason: res.error || "import_failed" });
          toast.error({ title: "Помилка імпорту", description: res.error || "Спробуйте ще раз." });
        }
        setIsLoading(false);
      },
      error: () => {
        setIsLoading(false);
        trackEvent("income_import_failed", { reason: "file_parse_error" });
        toast.error({ title: "Не вдалося прочитати файл" });
      }
    });
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
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
