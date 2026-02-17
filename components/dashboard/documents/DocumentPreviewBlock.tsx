"use client";

export default function DocumentPreviewBlock({
  preview,
}: {
  preview: Record<string, string | number>[];
}) {
  if (!preview || preview.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-2">
      <p className="text-sm font-bold text-gray-800">Превʼю документу</p>
      {preview.map((row, idx) => (
        <div key={idx} className="rounded-xl bg-white p-3 text-xs text-gray-700 space-y-1">
          {Object.entries(row).map(([k, v]) => (
            <div key={k}><span className="font-semibold">{k}:</span> {String(v)}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
