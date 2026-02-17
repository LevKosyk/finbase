"use client";

import { useEffect } from "react";
import { getOfflineQueue, removeOfflineQueueItem } from "@/lib/offline-queue";
import { trackEvent } from "@/lib/analytics-client";

async function syncQueue() {
  const queue = getOfflineQueue();
  for (const item of queue) {
    try {
      if (item.type === "income.create") {
        const res = await fetch("/api/income", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });
        if (!res.ok) continue;
      } else if (item.type === "expense.create") {
        const res = await fetch("/api/expenses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });
        if (!res.ok) continue;
      }
      removeOfflineQueueItem(item.id);
      trackEvent("offline_queue_synced_item", { type: item.type });
    } catch {
      // Keep item for next retry
    }
  }
}

export default function PWAProvider() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    const onOnline = () => {
      void syncQueue();
    };

    window.addEventListener("online", onOnline);
    void syncQueue();
    return () => window.removeEventListener("online", onOnline);
  }, []);

  return null;
}
