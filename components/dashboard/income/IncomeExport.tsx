"use client";

import ExportFormatModalButton from "@/components/dashboard/shared/ExportFormatModalButton";

export default function IncomeExport() {
  return <ExportFormatModalButton type="incomes" label="Експорт" defaultFormat="csv" />;
}
