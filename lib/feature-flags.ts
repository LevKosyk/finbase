import { Prisma } from "@prisma/client";
import { cacheKey, withRedisCache } from "@/lib/redis-cache";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export const DEFAULT_FEATURE_FLAGS = {
  bank_import: true,
  categorization_rules: true,
  fop_health: true,
  documents_module: true,
  statistics_module: true,
} as const;

export type FeatureFlagKey = keyof typeof DEFAULT_FEATURE_FLAGS | string;
type FeatureFlagRow = { enabled: boolean; rolloutPercent: number };
type FeatureFlagMeta = {
  enabled: boolean;
  rolloutPercent: number;
  matched: boolean;
  bucket: number | null;
};

function normalizeEnvBoolean(value?: string) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on") return true;
  if (normalized === "0" || normalized === "false" || normalized === "no" || normalized === "off") return false;
  return null;
}

function isMissingTableError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

function isMissingColumnError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2022";
}

function envKeyForFlag(flag: string) {
  return `FEATURE_FLAG_${flag.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`;
}

function envRolloutKeyForFlag(flag: string) {
  return `${envKeyForFlag(flag)}_ROLLOUT_PERCENT`;
}

function normalizeRolloutPercent(value?: string) {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(100, Math.round(parsed)));
}

function computeBucket(userId: string, flag: string) {
  const hash = createHash("sha256").update(`${userId}:${flag}`).digest("hex");
  return parseInt(hash.slice(0, 8), 16) % 100;
}

async function readFlagRow(flag: FeatureFlagKey) {
  try {
    const row = await prisma.featureFlag.findUnique({
      where: { key: String(flag) },
      select: { enabled: true, rolloutPercent: true },
    });
    if (!row) return null;
    return {
      enabled: row.enabled,
      rolloutPercent: Math.max(0, Math.min(100, row.rolloutPercent ?? 100)),
    } as FeatureFlagRow;
  } catch (error) {
    if (isMissingColumnError(error)) {
      const row = await prisma.featureFlag.findUnique({
        where: { key: String(flag) },
        select: { enabled: true },
      });
      if (!row) return null;
      return { enabled: row.enabled, rolloutPercent: 100 } as FeatureFlagRow;
    }
    if (!isMissingTableError(error)) throw error;
    return null;
  }
}

function resolveForUser(input: { enabled: boolean; rolloutPercent: number; userId?: string | null; flag: string }) {
  if (!input.enabled) return { matched: false, bucket: input.userId ? computeBucket(input.userId, input.flag) : null };
  if (input.rolloutPercent <= 0) return { matched: false, bucket: input.userId ? computeBucket(input.userId, input.flag) : null };
  if (input.rolloutPercent >= 100) return { matched: true, bucket: input.userId ? computeBucket(input.userId, input.flag) : null };
  if (!input.userId) return { matched: true, bucket: null };

  const bucket = computeBucket(input.userId, input.flag);
  return { matched: bucket < input.rolloutPercent, bucket };
}

async function resolveFlag(flag: FeatureFlagKey, userId?: string | null): Promise<FeatureFlagMeta> {
  const envOverride = normalizeEnvBoolean(process.env[envKeyForFlag(String(flag))]);
  const envRollout = normalizeRolloutPercent(process.env[envRolloutKeyForFlag(String(flag))]);
  if (envOverride !== null) {
    const rolloutPercent = envRollout ?? 100;
    const matched = resolveForUser({ enabled: envOverride, rolloutPercent, userId, flag: String(flag) });
    return { enabled: envOverride, rolloutPercent, matched: matched.matched, bucket: matched.bucket };
  }

  const key = cacheKey("feature-flag", String(flag), userId || "anon");
  return withRedisCache<FeatureFlagMeta>(key, 90, async () => {
    const row = await readFlagRow(flag);
    const enabled = row?.enabled ?? (DEFAULT_FEATURE_FLAGS[String(flag) as keyof typeof DEFAULT_FEATURE_FLAGS] ?? false);
    const rolloutPercent = envRollout ?? row?.rolloutPercent ?? 100;
    const matched = resolveForUser({ enabled, rolloutPercent, userId, flag: String(flag) });
    return { enabled, rolloutPercent, matched: matched.matched, bucket: matched.bucket };
  });
}

export async function isFeatureEnabled(flag: FeatureFlagKey, userId?: string | null) {
  const resolved = await resolveFlag(flag, userId);
  return resolved.matched;
}

export async function getFeatureFlagsSnapshot(userId?: string | null) {
  const result: Record<string, boolean> = {};

  const defaultKeys = Object.keys(DEFAULT_FEATURE_FLAGS);
  for (const key of defaultKeys) {
    result[key] = await isFeatureEnabled(key, userId);
  }

  try {
    const dbFlags = await prisma.featureFlag.findMany({
      select: { key: true },
    });
    for (const item of dbFlags) {
      if (!(item.key in result)) {
        result[item.key] = await isFeatureEnabled(item.key, userId);
      }
    }
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
  }

  return result;
}

export async function getFeatureFlagsSnapshotWithMeta(userId?: string | null) {
  const flags = await getFeatureFlagsSnapshot(userId);
  const meta: Record<string, FeatureFlagMeta> = {};
  for (const key of Object.keys(flags)) {
    meta[key] = await resolveFlag(key, userId);
  }
  return { flags, meta };
}
