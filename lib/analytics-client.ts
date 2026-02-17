"use client";

import posthog from "posthog-js";

type EventProps = Record<string, string | number | boolean | null | undefined>;

export function trackEvent(event: string, props?: EventProps) {
  try {
    posthog.capture(event, props);
  } catch {
    // Analytics should never break UI flows.
  }
}

