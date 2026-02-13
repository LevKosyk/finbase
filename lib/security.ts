import { createHash } from "crypto";
import { getRedisClient } from "@/lib/redis";

export function hashString(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function sanitizeText(value: string, maxLength = 3000) {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export async function enforceRateLimit(key: string, limit: number, windowSeconds: number) {
  const redis = getRedisClient();
  if (!redis) {
    return { allowed: true, remaining: Math.max(limit - 1, 0) };
  }

  try {
    await redis.connect();
    const fullKey = `finbase:ratelimit:${key}`;
    const count = await redis.incr(fullKey);
    if (count === 1) {
      await redis.expire(fullKey, windowSeconds);
    }
    const allowed = count <= limit;
    return { allowed, remaining: Math.max(limit - count, 0) };
  } catch {
    return { allowed: true, remaining: Math.max(limit - 1, 0) };
  }
}

