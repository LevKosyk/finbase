"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { importExpenses } from "@/app/actions/expenses";
import type { ExpenseImportRow } from "@/lib/types/expenses";

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

export default function ExpenseImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const mapRows = (rows: Record<string, unknown>[]) => {
    return rows.map((row) => {
      const mapped: Partial<Record<keyof ExpenseImportRow, string>> = {};
      Object.entries(row).forEach(([key, value]) => {
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
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = mapRows(results.data as Record<string, string>[]);
        const res = await importExpenses(rows);
        if (res.success) {
          alert(`Імпортовано записів: ${res.count}`);
          router.refresh();
        } else {
          alert(res.error || "Помилка імпорту");
        }
        setIsLoading(false);
      },
      error: () => {
        setIsLoading(false);
        alert("Не вдалося прочитати CSV");
      }
    });
  };

  const handleXlsx = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const rows = mapRows(jsonRows);
      const res = await importExpenses(rows);
      if (res.success) {
        alert(`Імпортовано записів: ${res.count}`);
        router.refresh();
      } else {
        alert(res.error || "Помилка імпорту");
      }
    } catch {
      alert("Не вдалося прочитати XLSX");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFile = async (file: File) => {
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
