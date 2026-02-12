"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { importIncomes, type IncomeImportRow } from "@/app/actions/income";

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

export default function IncomeImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleFile = async (file: File) => {
    setIsLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = (results.data as Record<string, string>[]).map((row) => {
          const mapped: any = {};
          Object.entries(row).forEach(([key, value]) => {
            const normalized = key.trim().toLowerCase();
            const target = headerMap[normalized];
            if (target) mapped[target] = value?.toString().trim();
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
          alert(`Імпортовано записів: ${res.count}`);
          router.refresh();
        } else {
          alert(res.error || "Помилка імпорту");
        }
        setIsLoading(false);
      },
      error: () => {
        setIsLoading(false);
        alert("Не вдалося прочитати файл");
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
        className="font-bold border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm text-gray-700 bg-white"
        leftIcon={<UploadCloud className="w-5 h-5" />}
        onClick={() => inputRef.current?.click()}
        isLoading={isLoading}
      >
        <span className="hidden sm:inline">Імпорт CSV</span>
      </Button>
    </>
  );
}
