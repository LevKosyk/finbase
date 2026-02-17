"use client";

type QueueType = "income.create" | "expense.create";

export type QueueItem = {
  id: string;
  type: QueueType;
  payload: Record<string, unknown>;
  createdAt: number;
};

const STORAGE_KEY = "finbase_offline_queue_v1";

function readQueue(): QueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueueItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function enqueueOffline(item: Omit<QueueItem, "id" | "createdAt">) {
  const queue = readQueue();
  queue.push({
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  });
  writeQueue(queue);
}

export function getOfflineQueue() {
  return readQueue();
}

export function removeOfflineQueueItem(id: string) {
  const next = readQueue().filter((item) => item.id !== id);
  writeQueue(next);
}
