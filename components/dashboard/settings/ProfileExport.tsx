"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";

const formats = ["csv", "xlsx", "pdf", "json"];

export default function ProfileExport() {
  const download = (format: string) => {
    window.location.href = `/api/export?type=profile&format=${format}`;
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        className="font-bold border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm text-gray-700 bg-white"
        leftIcon={<Download className="w-5 h-5" />}
        onClick={() => download("pdf")}
      >
        Експорт профілю
      </Button>
      <div className="flex gap-2">
        {formats.map((f) => (
          <button
            key={f}
            onClick={() => download(f)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:text-gray-900 hover:border-gray-300 bg-white"
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
