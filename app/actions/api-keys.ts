"use server";

import { randomBytes, createHash } from "crypto";
import { createClient } from "@/utils/supabase/server";
import { getRedisClient } from "@/lib/redis";
import { ensureSensitiveActionAccess } from "@/lib/sensitive-action";
import { logAuditEvent } from "@/lib/audit-log";

type ApiKeyItem = {
  id: string;
  name: string;
  prefix: string;
  keyHash: string;
  createdAt: string;
  revokedAt?: string | null;
};

function redisListKey(userId: string) {
  return `finbase:api-keys:user:${userId}`;
}

async function ensureRedis() {
  const redis = getRedisClient();
  if (!redis) return null;
  if (!["ready", "connect", "connecting"].includes(redis.status)) {
    await redis.connect();
  }
  return redis;
}

async function readKeys(userId: string): Promise<ApiKeyItem[]> {
  const redis = await ensureRedis();
  if (!redis) return [];
  const raw = await redis.get(redisListKey(userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ApiKeyItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeKeys(userId: string, keys: ApiKeyItem[]) {
  const redis = await ensureRedis();
  if (!redis) return false;
  await redis.set(redisListKey(userId), JSON.stringify(keys), "EX", 60 * 60 * 24 * 365);
  return true;
}

export async function getApiKeys() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const keys = await readKeys(user.id);
  return keys.map((k) => ({
    id: k.id,
    name: k.name,
    prefix: k.prefix,
    createdAt: k.createdAt,
    revokedAt: k.revokedAt || null,
  }));
}

export async function createApiKey(name: string) {
  const access = await ensureSensitiveActionAccess({
    action: "api_key.create",
    requireRecentReauth: true,
    requireTwoFactor: true,
  });
  if (!access.ok) return { success: false, error: access.error };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const safeName = String(name || "API Key").trim().slice(0, 64) || "API Key";
  const raw = `fb_${randomBytes(24).toString("hex")}`;
  const prefix = raw.slice(0, 12);
  const keyHash = createHash("sha256").update(raw).digest("hex");

  const keys = await readKeys(user.id);
  const item: ApiKeyItem = {
    id: randomBytes(10).toString("hex"),
    name: safeName,
    prefix,
    keyHash,
    createdAt: new Date().toISOString(),
  };
  const next = [item, ...keys].slice(0, 50);
  const ok = await writeKeys(user.id, next);
  if (!ok) return { success: false, error: "Redis is not configured" };

  await logAuditEvent({
    userId: user.id,
    action: "security.api_key.created",
    entityType: "api_key",
    entityId: item.id,
    metadata: { name: safeName, prefix },
  });

  return {
    success: true,
    apiKey: raw,
    key: {
      id: item.id,
      name: item.name,
      prefix: item.prefix,
      createdAt: item.createdAt,
    },
  };
}

export async function revokeApiKey(id: string) {
  const access = await ensureSensitiveActionAccess({
    action: "api_key.revoke",
    requireRecentReauth: true,
    requireTwoFactor: true,
  });
  if (!access.ok) return { success: false, error: access.error };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  const keys = await readKeys(user.id);
  const next = keys.map((k) => (k.id === id ? { ...k, revokedAt: new Date().toISOString() } : k));
  await writeKeys(user.id, next);

  await logAuditEvent({
    userId: user.id,
    action: "security.api_key.revoked",
    entityType: "api_key",
    entityId: id,
  });

  return { success: true };
}
