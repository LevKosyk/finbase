import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cacheKey, getCacheJson, setCacheJson } from "@/lib/redis-cache";

function isMissingTableError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

function isValidReportingPeriod(value?: string | null) {
  return value === "monthly" || value === "quarterly";
}

export async function enforceUserFopGroup3(userId: string, source: string) {
  const guardKey = cacheKey("user", userId, "guard", "fop-group-3");
  const cached = await getCacheJson<boolean>(guardKey);
  if (cached) return;

  try {
    const settings = await prisma.fOPSettings.findUnique({
      where: { userId },
      select: { id: true, group: true, reportingPeriod: true },
    });

    if (!settings) {
      await prisma.fOPSettings.create({
        data: {
          userId,
          group: 3,
          reportingPeriod: "quarterly",
          taxPaymentDay: 20,
          reportDay: 20,
        },
      });
      await prisma.auditLog.create({
        data: {
          userId,
          action: "security.fop_group.autofix",
          entityType: "fop_settings",
          metadata: {
            reason: "missing_settings",
            source,
            fromGroup: null,
            toGroup: 3,
          },
        },
      });
      await setCacheJson(guardKey, true, 600);
      return;
    }

    const nextData: { group?: number; reportingPeriod?: string } = {};
    let changed = false;

    if (settings.group !== 3) {
      nextData.group = 3;
      changed = true;
    }
    if (!isValidReportingPeriod(settings.reportingPeriod)) {
      nextData.reportingPeriod = "quarterly";
      changed = true;
    }

    if (changed) {
      await prisma.fOPSettings.update({
        where: { id: settings.id },
        data: nextData,
      });
      await prisma.auditLog.create({
        data: {
          userId,
          action: "security.fop_group.autofix",
          entityType: "fop_settings",
          metadata: {
            source,
            fromGroup: settings.group,
            toGroup: 3,
            fromReportingPeriod: settings.reportingPeriod,
            toReportingPeriod: nextData.reportingPeriod || settings.reportingPeriod,
          },
        },
      });
    }

    await setCacheJson(guardKey, true, 600);
  } catch (error) {
    if (isMissingTableError(error)) return;
    console.error("Failed to enforce FOP group 3:", error);
  }
}
