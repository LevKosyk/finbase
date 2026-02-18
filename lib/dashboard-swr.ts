"use client";

import type { ScopedMutator } from "swr";

type DashboardModule = "income" | "expenses" | "statistics" | "bank-imports";

const PREFIXES: Record<DashboardModule, string> = {
  income: "/api/dashboard/income",
  expenses: "/api/dashboard/expenses",
  statistics: "/api/dashboard/statistics",
  "bank-imports": "/api/dashboard/bank-imports",
};

const immediateQueued = new Set<DashboardModule>();
const deferredQueued = new Set<DashboardModule>();
let immediateTimer: ReturnType<typeof setTimeout> | null = null;
let deferredTimer: ReturnType<typeof setTimeout> | null = null;
let latestMutate: ScopedMutator | null = null;

function matcherFor(modules: DashboardModule[]) {
  const prefixes = modules.map((module) => PREFIXES[module]);
  return (key: unknown) => typeof key === "string" && prefixes.some((prefix) => key.startsWith(prefix));
}

export function queueDashboardRevalidate(mutate: ScopedMutator, modules: DashboardModule[], delayMs = 250) {
  queueDashboardRevalidateByPriority(mutate, { immediate: modules }, delayMs, 1500);
}

export function queueDashboardRevalidateByPriority(
  mutate: ScopedMutator,
  payload: { immediate?: DashboardModule[]; deferred?: DashboardModule[] },
  immediateDelayMs = 250,
  deferredDelayMs = 1500
) {
  latestMutate = mutate;
  payload.immediate?.forEach((module) => immediateQueued.add(module));
  payload.deferred?.forEach((module) => deferredQueued.add(module));

  if (!immediateTimer && immediateQueued.size > 0) {
    immediateTimer = setTimeout(() => {
      immediateTimer = null;
      const currentMutate = latestMutate;
      const targets = Array.from(immediateQueued);
      immediateQueued.clear();
      if (!currentMutate || targets.length === 0) return;
      void currentMutate(matcherFor(targets), undefined, { revalidate: true });
    }, immediateDelayMs);
  }

  if (!deferredTimer && deferredQueued.size > 0) {
    deferredTimer = setTimeout(() => {
      deferredTimer = null;
      const currentMutate = latestMutate;
      const targets = Array.from(deferredQueued);
      deferredQueued.clear();
      if (!currentMutate || targets.length === 0) return;
      void currentMutate(matcherFor(targets), undefined, { revalidate: true });
    }, deferredDelayMs);
  }
}
