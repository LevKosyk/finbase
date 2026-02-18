import { randomUUID } from "crypto";
import { getRedisClient } from "@/lib/redis";

export type AsyncJobType = "bank_import";
export type AsyncJobStatus = "queued" | "processing" | "completed" | "failed";

export interface BankImportJobPayload {
  rows: Array<{
    date: string;
    amount: number;
    description?: string;
    counterparty?: string;
    currency?: string;
    direction?: "income" | "expense" | "";
  }>;
  fileName: string;
  idempotencyKey?: string;
}

export interface AsyncJobRecord {
  id: string;
  type: AsyncJobType;
  userId: string;
  status: AsyncJobStatus;
  payload: BankImportJobPayload;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  result?: Record<string, unknown>;
}

const JOB_KEY_PREFIX = "finbase:jobs:data:";
const JOB_TTL_SECONDS = 60 * 60 * 24;

function jobKey(jobId: string) {
  return `${JOB_KEY_PREFIX}${jobId}`;
}

async function ensureConnected(redis: ReturnType<typeof getRedisClient>) {
  if (!redis) return false;
  if (!["ready", "connect", "connecting"].includes(redis.status)) {
    await redis.connect();
  }
  return true;
}

export async function enqueueAsyncJob(input: {
  type: AsyncJobType;
  userId: string;
  payload: BankImportJobPayload;
}) {
  const redis = getRedisClient();
  if (!(await ensureConnected(redis))) return { ok: false as const, error: "Redis is not configured" };

  try {
    const id = randomUUID();
    const record: AsyncJobRecord = {
      id,
      type: input.type,
      userId: input.userId,
      status: "queued",
      payload: input.payload,
      createdAt: new Date().toISOString(),
    };

    await redis!.set(jobKey(id), JSON.stringify(record), "EX", JOB_TTL_SECONDS);

    return { ok: true as const, jobId: id };
  } catch {
    return { ok: false as const, error: "Failed to enqueue job" };
  }
}

export async function getAsyncJob(jobId: string) {
  const redis = getRedisClient();
  if (!(await ensureConnected(redis))) return null;

  try {
    const raw = await redis!.get(jobKey(jobId));
    if (!raw) return null;
    return JSON.parse(raw) as AsyncJobRecord;
  } catch {
    return null;
  }
}

export async function saveAsyncJob(record: AsyncJobRecord) {
  const redis = getRedisClient();
  if (!(await ensureConnected(redis))) return false;

  try {
    await redis!.set(jobKey(record.id), JSON.stringify(record), "EX", JOB_TTL_SECONDS);
    return true;
  } catch {
    return false;
  }
}

export async function popQueuedJobId() {
  return null;
}
