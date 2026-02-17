"use client";

import useSWR from "swr";

const fetcher = async (url: string): Promise<{ flags: Record<string, boolean> }> => {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch feature flags");
  return response.json();
};

export default function FeatureFlagsPanel() {
  const { data } = useSWR("/api/feature-flags", fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
  });

  const flags = data?.flags || {};
  const keys = Object.keys(flags);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Feature Flags</h3>
      <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/60">
        {keys.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Флаги ще не налаштовані.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {keys.map((key) => (
              <div key={key} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 dark:bg-gray-900">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{key}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    flags[key]
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  {flags[key] ? "ON" : "OFF"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
