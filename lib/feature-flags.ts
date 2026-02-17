import { Prisma } from "@prisma/client";
import { cacheKey, withRedisCache } from "@/lib/redis-cache";
import { prisma } from "@/lib/prisma";

export const DEFAULT_FEATURE_FLAGS = {
  bank_import: true,
  categorization_rules: true,
  fop_health: true,
  documents_module: true,
  statistics_module: true,
} as const;

export type FeatureFlagKey = keyof typeof DEFAULT_FEATURE_FLAGS | string;

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

function envKeyForFlag(flag: string) {
  return `FEATURE_FLAG_${flag.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`;
}

export async function isFeatureEnabled(flag: FeatureFlagKey) {
  const envOverride = normalizeEnvBoolean(process.env[envKeyForFlag(String(flag))]);
  if (envOverride !== null) return envOverride;

  const key = cacheKey("feature-flag", String(flag));
  return withRedisCache<boolean>(key, 90, async () => {
    try {
      const row = await prisma.featureFlag.findUnique({ where: { key: String(flag) } });
      if (row) return row.enabled;
    } catch (error) {
      if (!isMissingTableError(error)) throw error;
    }
    return DEFAULT_FEATURE_FLAGS[String(flag) as keyof typeof DEFAULT_FEATURE_FLAGS] ?? false;
  });
}

export async function getFeatureFlagsSnapshot() {
  const result: Record<string, boolean> = {};

  const defaultKeys = Object.keys(DEFAULT_FEATURE_FLAGS);
  for (const key of defaultKeys) {
    result[key] = await isFeatureEnabled(key);
  }

  try {
    const dbFlags = await prisma.featureFlag.findMany({
      select: { key: true, enabled: true },
    });
    for (const item of dbFlags) {
      if (!(item.key in result)) {
        result[item.key] = item.enabled;
      }
    }
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
  }

  return result;
}
