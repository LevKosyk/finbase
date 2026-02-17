import { createHash } from "crypto";
import { getRedisClient } from "@/lib/redis";

function normalizeKey(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

export async function checkAndStoreIdempotency(input: {
  scope: string;
  userId: string;
  key?: string | null;
  ttlSeconds?: number;
}) {
  const ttlSeconds = input.ttlSeconds || 60 * 15;
  const keyRaw = input.key?.trim();
  if (!keyRaw) return { ok: true as const, duplicate: false as const };

  const redis = getRedisClient();
  if (!redis) return { ok: true as const, duplicate: false as const };

  try {
    await redis.connect();
    const key = `finbase:idempotency:${input.scope}:${input.userId}:${normalizeKey(keyRaw)}`;
    const set = await redis.set(key, "1", "EX", ttlSeconds, "NX");
    if (set !== "OK") {
      return { ok: false as const, duplicate: true as const, error: "Duplicate request" };
    }
    return { ok: true as const, duplicate: false as const };
  } catch {
    return { ok: true as const, duplicate: false as const };
  }
}
