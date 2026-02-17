"use client";

import useSWR from "swr";
import { Clock3 } from "lucide-react";

type AuditLogItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  ip: string | null;
  createdAt: string;
};

const fetcher = async (url: string): Promise<{ logs: AuditLogItem[] }> => {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch audit logs");
  return response.json();
};

export default function AuditLogPanel() {
  const { data } = useSWR("/api/audit-logs?limit=20", fetcher, {
    refreshInterval: 45000,
    revalidateOnFocus: true,
  });
  const logs = data?.logs || [];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Журнал дій</h3>
      <div className="rounded-2xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-gray-800/60">
        {logs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Записи журналу поки відсутні.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((item) => (
              <div key={item.id} className="rounded-xl bg-white px-3 py-2 dark:bg-gray-900">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.action}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock3 className="h-3.5 w-3.5" />
                    {new Date(item.createdAt).toLocaleString("uk-UA")}
                  </div>
                </div>
                <div className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {item.entityType}
                  {item.entityId ? ` • ${item.entityId}` : ""}
                  {item.ip ? ` • IP ${item.ip}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
