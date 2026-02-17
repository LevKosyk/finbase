"use client";

import { useReportWebVitals } from "next/web-vitals";
import { trackEvent } from "@/lib/analytics-client";

const BUDGETS: Record<string, number> = {
  LCP: 2500,
  CLS: 0.1,
  TTFB: 600,
};

export default function WebVitalsTracker() {
  useReportWebVitals((metric) => {
    if (!["LCP", "CLS", "TTFB"].includes(metric.name)) return;

    const budget = BUDGETS[metric.name] ?? null;
    const degraded = budget !== null ? metric.value > budget : false;

    trackEvent("web_vital", {
      metric_name: metric.name,
      metric_value: Number(metric.value.toFixed(3)),
      metric_rating: metric.rating,
      page: window.location.pathname,
      budget,
      degraded,
      metric_id: metric.id,
    });

    if (degraded) {
      trackEvent("performance_budget_degraded", {
        metric_name: metric.name,
        metric_value: Number(metric.value.toFixed(3)),
        budget,
        page: window.location.pathname,
      });
    }
  });

  return null;
}
