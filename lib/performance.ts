import { getRedisClient } from "@/lib/redis";

type PerfRecord = {
  name: string;
  durationMs: number;
  startedAt: string;
  ok: boolean;
  degraded: boolean;
  budgetMs: number | null;
  meta?: Record<string, string | number | boolean | null>;
};

const PERF_PREFIX = "finbase:perf:v1";
const DEFAULT_BUDGET_MS = 600;
const MAX_GLOBAL_EVENTS = 800;
const MAX_PER_ACTION_EVENTS = 300;

function getBudget(actionName: string, explicitBudget?: number) {
  if (typeof explicitBudget === "number") return explicitBudget;
  if (actionName.includes("statistics")) return 900;
  if (actionName.includes("documents")) return 900;
  if (actionName.includes("dashboard")) return 600;
  return DEFAULT_BUDGET_MS;
}

async function pushPerfRecord(record: PerfRecord) {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    await redis.connect();
    const globalKey = `${PERF_PREFIX}:events`;
    const actionKey = `${PERF_PREFIX}:action:${record.name}`;
    const payload = JSON.stringify(record);
    await redis
      .multi()
      .lpush(globalKey, payload)
      .ltrim(globalKey, 0, MAX_GLOBAL_EVENTS - 1)
      .lpush(actionKey, payload)
      .ltrim(actionKey, 0, MAX_PER_ACTION_EVENTS - 1)
      .exec();
  } catch (error) {
    console.warn("[perf] push failed:", error);
  }
}

export async function measureAction<T>(
  name: string,
  fn: () => Promise<T>,
  options?: {
    budgetMs?: number;
    meta?: Record<string, string | number | boolean | null>;
  }
): Promise<T> {
  const startedAt = Date.now();
  const budgetMs = getBudget(name, options?.budgetMs);
  try {
    const result = await fn();
    const durationMs = Date.now() - startedAt;
    const degraded = durationMs > budgetMs;
    await pushPerfRecord({
      name,
      durationMs,
      startedAt: new Date(startedAt).toISOString(),
      ok: true,
      degraded,
      budgetMs,
      meta: options?.meta,
    });
    return result;
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    await pushPerfRecord({
      name,
      durationMs,
      startedAt: new Date(startedAt).toISOString(),
      ok: false,
      degraded: true,
      budgetMs,
      meta: options?.meta,
    });
    throw error;
  }
}

export async function getPerfRecent(limit = 200) {
  const redis = getRedisClient();
  if (!redis) return [] as PerfRecord[];
  try {
    await redis.connect();
    const raw = await redis.lrange(`${PERF_PREFIX}:events`, 0, Math.max(0, limit - 1));
    return raw
      .map((entry) => {
        try {
          return JSON.parse(entry) as PerfRecord;
        } catch {
          return null;
        }
      })
      .filter((entry): entry is PerfRecord => Boolean(entry));
  } catch (error) {
    console.warn("[perf] read failed:", error);
    return [];
  }
}

export function summarizePerf(records: PerfRecord[]) {
  const groups = new Map<string, number[]>();
  for (const record of records) {
    const arr = groups.get(record.name) || [];
    arr.push(record.durationMs);
    groups.set(record.name, arr);
  }

  const summary = Array.from(groups.entries()).map(([name, durations]) => {
    const sorted = [...durations].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const max = sorted[sorted.length - 1] || 0;
    const avg = sorted.reduce((acc, n) => acc + n, 0) / Math.max(1, sorted.length);
    return {
      name,
      count: sorted.length,
      p50,
      p95,
      max,
      avg: Number(avg.toFixed(1)),
      overBudgetRate: Number(
        (
          records.filter((r) => r.name === name && r.degraded).length /
          Math.max(1, sorted.length)
        ).toFixed(3)
      ),
    };
  });

  return summary.sort((a, b) => b.p95 - a.p95);
}
