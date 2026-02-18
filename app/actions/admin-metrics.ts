"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/rbac";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export async function getBusinessMetrics() {
  const auth = await requireAdmin();
  if (!auth.ok) return null;

  const now = new Date();
  const dayNow = startOfDay(now);
  const last30 = addDays(dayNow, -30);

  const [
    totalUsers,
    usersLast30,
    proUsers,
    churnedProLast30,
    usersCreatedForD1,
    usersCreatedForD7,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: last30 } } }),
    prisma.subscription.count({ where: { plan: { notIn: ["Free", "free"] }, status: "active" } }),
    prisma.subscription.count({
      where: {
        plan: { notIn: ["Free", "free"] },
        OR: [
          { status: { not: "active" } },
          { endDate: { gte: last30, lt: now } },
        ],
      },
    }),
    prisma.user.findMany({
      where: {
        createdAt: { gte: addDays(dayNow, -2), lt: addDays(dayNow, -1) },
      },
      select: { id: true, createdAt: true },
    }),
    prisma.user.findMany({
      where: {
        createdAt: { gte: addDays(dayNow, -8), lt: addDays(dayNow, -7) },
      },
      select: { id: true, createdAt: true },
    }),
  ]);

  const recentUsers = await prisma.user.findMany({
    where: { createdAt: { gte: last30 } },
    select: {
      id: true,
      createdAt: true,
      settings: { select: { id: true } },
      incomes: { select: { id: true }, take: 1, where: { deletedAt: null } },
      expenses: { select: { id: true }, take: 1, where: { deletedAt: null } },
      documentGenerations: { select: { id: true }, take: 1 },
    },
  });

  const activated = recentUsers.filter((u) => {
    const activationDeadline = addDays(u.createdAt, 3);
    const hasCoreData = Boolean(u.settings || u.incomes.length || u.expenses.length || u.documentGenerations.length);
    return hasCoreData && activationDeadline >= now;
  }).length;

  async function retentionFor(users: Array<{ id: string; createdAt: Date }>, targetDay: number) {
    if (users.length === 0) return 0;
    let retained = 0;
    for (const user of users) {
      const from = addDays(startOfDay(user.createdAt), targetDay);
      const to = addDays(from, 1);
      const [incomeCount, expenseCount, auditCount, docCount] = await Promise.all([
        prisma.income.count({ where: { userId: user.id, createdAt: { gte: from, lt: to } } }),
        prisma.expense.count({ where: { userId: user.id, createdAt: { gte: from, lt: to } } }),
        prisma.auditLog.count({ where: { userId: user.id, createdAt: { gte: from, lt: to } } }),
        prisma.documentGeneration.count({ where: { userId: user.id, createdAt: { gte: from, lt: to } } }),
      ]);
      if (incomeCount + expenseCount + auditCount + docCount > 0) retained += 1;
    }
    return Math.round((retained / users.length) * 1000) / 10;
  }

  const d1Retention = await retentionFor(usersCreatedForD1, 1);
  const d7Retention = await retentionFor(usersCreatedForD7, 7);

  const subscriptions = await prisma.subscription.groupBy({
    by: ["plan"],
    _count: { _all: true },
  });
  const freeCount = subscriptions
    .filter((s) => s.plan.toLowerCase() === "free")
    .reduce((acc, item) => acc + item._count._all, 0);
  const paidCount = subscriptions
    .filter((s) => s.plan.toLowerCase() !== "free")
    .reduce((acc, item) => acc + item._count._all, 0);

  const conversionRate = freeCount + paidCount === 0 ? 0 : Math.round((paidCount / (freeCount + paidCount)) * 1000) / 10;
  const churnRate = proUsers === 0 ? 0 : Math.round((churnedProLast30 / proUsers) * 1000) / 10;
  const activationRate = usersLast30 === 0 ? 0 : Math.round((activated / usersLast30) * 1000) / 10;

  return {
    users: {
      total: totalUsers,
      newLast30: usersLast30,
    },
    activation: {
      rate: activationRate,
      activated,
      cohortSize: usersLast30,
    },
    retention: {
      d1: d1Retention,
      d7: d7Retention,
      d1Cohort: usersCreatedForD1.length,
      d7Cohort: usersCreatedForD7.length,
    },
    conversion: {
      free: freeCount,
      paid: paidCount,
      freeToProRate: conversionRate,
    },
    churn: {
      rate: churnRate,
      churnedProLast30,
      activePro: proUsers,
    },
    generatedAt: new Date().toISOString(),
  };
}
