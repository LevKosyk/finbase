"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const enabled = process.env.NEXT_PUBLIC_POSTHOG_ENABLED !== "false";

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!posthogKey || !enabled) return;

    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: true,
    });
  }, []);

  useEffect(() => {
    if (!posthogKey || !enabled) return;
    const url = `${window.location.origin}${pathname}${window.location.search || ""}`;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname]);

  return <>{children}</>;
}
