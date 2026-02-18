"use client";

import { SWRConfig } from "swr";
import { useMemo } from "react";

const STORAGE_KEY = "finbase:swr:v1";

type CacheEntry = [string, unknown];

function shouldPersistKey(key: string) {
  return key.startsWith("/api/dashboard/") || key.startsWith("/api/feature-flags") || key.startsWith("/api/audit-logs");
}

function createSessionCache() {
  const map = new Map<string, any>();

  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CacheEntry[];
        parsed.forEach(([k, v]) => map.set(k, v));
      }
    } catch {
      // ignore cache hydration errors
    }

    const persist = () => {
      try {
        const payload: CacheEntry[] = [];
        map.forEach((value, key) => {
          if (shouldPersistKey(key)) payload.push([key, value]);
        });
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // ignore persist errors
      }
    };

    window.addEventListener("beforeunload", persist);
    window.addEventListener("pagehide", persist);
  }

  return map;
}

export default function SWRProvider({ children }: { children: React.ReactNode }) {
  const provider = useMemo(() => createSessionCache(), []);

  return (
    <SWRConfig
      value={{
        provider: () => provider,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        revalidateIfStale: false,
        shouldRetryOnError: true,
        errorRetryCount: 2,
        errorRetryInterval: 3000,
        dedupingInterval: 60000,
        keepPreviousData: true,
      }}
    >
      {children}
    </SWRConfig>
  );
}
