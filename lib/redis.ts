import Redis from "ioredis";

declare global {
  var __finbaseRedis: Redis | undefined;
}

function createRedisClient() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  const client = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });

  client.on("error", (error) => {
    console.warn("[Redis] connection error:", error.message);
  });

  return client;
}

export function getRedisClient() {
  if (!process.env.REDIS_URL) return null;
  if (!global.__finbaseRedis) {
    global.__finbaseRedis = createRedisClient() || undefined;
  }
  return global.__finbaseRedis || null;
}
