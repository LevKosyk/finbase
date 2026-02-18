"use client";

import { useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/analytics-client";

type ExportType = "incomes" | "expenses" | "profile" | "statistics";
type ExportFormat = "csv" | "xlsx" | "pdf" | "json";

interface Props {
  type: ExportType;
  label?: string;
  defaultFormat?: ExportFormat;
  formats?: ExportFormat[];
  extraParams?: Record<string, string | undefined>;
}

const ALL_FORMATS: ExportFormat[] = ["csv", "xlsx", "pdf", "json"];

export default function ExportFormatModalButton({
  type,
  label = "Експорт",
  defaultFormat = "csv",
  formats = ALL_FORMATS,
  extraParams,
}: Props) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>(defaultFormat);

  const allowed = useMemo(() => ALL_FORMATS.filter((item) => formats.includes(item)), [formats]);

  const submitExport = () => {
    trackEvent("export_submitted", { export_type: type, export_format: format });
    const params = new URLSearchParams({ type, format });
    if (extraParams) {
      Object.entries(extraParams).forEach(([key, value]) => {
        if (!value) return;
        params.set(key, value);
      });
    }
    window.location.href = `/api/export?${params.toString()}`;
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="secondary"
        size="md"
        leftIcon={<Download className="w-5 h-5" />}
        onClick={() => {
          setOpen(true);
          trackEvent("export_modal_opened", { export_type: type });
        }}
        className="min-w-[148px]"
      >
        {label}
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Експорт даних</h3>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Формат файлу</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ExportFormat)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {allowed.map((item) => (
                  <option key={item} value={item}>
                    {item.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Скасувати
              </Button>
              <Button onClick={submitExport}>Завантажити</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
