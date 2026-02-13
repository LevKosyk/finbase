"use client";

import ExportFormatModalButton from "@/components/dashboard/shared/ExportFormatModalButton";

export default function ProfileExport() {
  return <ExportFormatModalButton type="profile" label="Експорт профілю" defaultFormat="pdf" />;
}
