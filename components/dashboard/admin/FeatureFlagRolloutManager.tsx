"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/Button";

type FlagRow = {
  id: string;
  key: string;
  enabled: boolean;
  rolloutPercent: number;
  description: string | null;
  updatedAt: string;
};

const fetcher = async (url: string): Promise<{ flags: FlagRow[] }> => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load feature flags");
  return res.json();
};

export default function FeatureFlagRolloutManager() {
  const { data, mutate, isLoading } = useSWR("/api/admin/feature-flags", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });
  const [savingKey, setSavingKey] = useState<string>("");

  const flags = useMemo(() => data?.flags || [], [data?.flags]);

  if (isLoading) {
    return <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-sm text-gray-500">Loading flags...</div>;
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="grid grid-cols-12 bg-gray-50 dark:bg-gray-800 px-4 py-2 text-xs font-bold text-gray-500">
        <div className="col-span-3">Flag</div>
        <div className="col-span-2">Enabled</div>
        <div className="col-span-4">Rollout %</div>
        <div className="col-span-3 text-right">Action</div>
      </div>
      {flags.map((flag) => (
        <FlagRowItem key={flag.id} flag={flag} savingKey={savingKey} setSavingKey={setSavingKey} onSaved={() => mutate()} />
      ))}
    </div>
  );
}

function FlagRowItem({
  flag,
  savingKey,
  setSavingKey,
  onSaved,
}: {
  flag: FlagRow;
  savingKey: string;
  setSavingKey: (key: string) => void;
  onSaved: () => void;
}) {
  const [enabled, setEnabled] = useState(flag.enabled);
  const [rolloutPercent, setRolloutPercent] = useState(flag.rolloutPercent);

  return (
    <div className="grid grid-cols-12 items-center px-4 py-3 border-t border-gray-100 dark:border-gray-700">
      <div className="col-span-3">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{flag.key}</p>
        {flag.description ? <p className="text-xs text-gray-500">{flag.description}</p> : null}
      </div>
      <div className="col-span-2">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          <span>{enabled ? "ON" : "OFF"}</span>
        </label>
      </div>
      <div className="col-span-4 pr-4">
        <input
          type="range"
          min={0}
          max={100}
          value={rolloutPercent}
          onChange={(e) => setRolloutPercent(Number(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-1">{rolloutPercent}%</p>
      </div>
      <div className="col-span-3 flex justify-end">
        <Button
          size="sm"
          isLoading={savingKey === flag.key}
          onClick={async () => {
            setSavingKey(flag.key);
            try {
              await fetch("/api/admin/feature-flags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: flag.key, enabled, rolloutPercent }),
              });
              onSaved();
            } finally {
              setSavingKey("");
            }
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
