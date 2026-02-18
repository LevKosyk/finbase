import { createHash } from "crypto";
import { getRedisClient } from "@/lib/redis";

const APP_CACHE_PREFIX = "finbase:v1";

export function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function cacheKey(...parts: Array<string | number | undefined | null>) {
  const normalized = parts.filter((value) => value !== undefined && value !== null).map(String);
  return [APP_CACHE_PREFIX, ...normalized].join(":");
}

export async function getCacheJson<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  try {
    if (redis.status !== "ready" && redis.status !== "connecting" && redis.status !== "connect") {
      await redis.connect();
    }
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn("[Redis] getCacheJson failed:", error);
    return null;
  }
}

export async function setCacheJson<T>(key: string, value: T, ttlSeconds: number) {
  const redis = getRedisClient();
  if (!redis) return;
  try {
    if (redis.status !== "ready" && redis.status !== "connecting" && redis.status !== "connect") {
      await redis.connect();
    }
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    console.warn("[Redis] setCacheJson failed:", error);
  }
}

export async function withRedisCache<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
  const cached = await getCacheJson<T>(key);
  if (cached !== null) return cached;
  const fresh = await compute();
  await setCacheJson(key, fresh, ttlSeconds);
  return fresh;
}

export async function invalidateUserCache(userId: string) {
  const redis = getRedisClient();
  if (!redis) return;
  const pattern = cacheKey("user", userId, "*");
  try {
    if (redis.status !== "ready" && redis.status !== "connecting" && redis.status !== "connect") {
      await redis.connect();
    }
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 200);
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch (error) {
    console.warn("[Redis] invalidateUserCache failed:", error);
  }
}
