"use client";

import ExportFormatModalButton from "@/components/dashboard/shared/ExportFormatModalButton";

export default function ExpenseExport() {
  return <ExportFormatModalButton type="expenses" label="Експорт" defaultFormat="csv" />;
}
