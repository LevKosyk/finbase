"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
const enabled = process.env.NEXT_PUBLIC_POSTHOG_ENABLED !== "false";

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const clientRef = useRef<any>(null);

  useEffect(() => {
    if (!posthogKey || !enabled) return;
    let cancelled = false;

    const boot = async () => {
      const posthogModule = await import("posthog-js");
      if (cancelled) return;
      const ph = posthogModule.default;
      ph.init(posthogKey, {
        api_host: posthogHost,
        person_profiles: "identified_only",
        capture_pageview: false,
        capture_pageleave: true,
        autocapture: true,
        capture_performance: true,
      });
      clientRef.current = ph;

      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;
      if (!currentUser) {
        ph.reset();
      } else {
        ph.identify(currentUser.id, {
          email: currentUser.email,
          provider: currentUser.app_metadata?.provider,
        });
      }

      const initialUrl = `${window.location.origin}${window.location.pathname}${window.location.search || ""}`;
      ph.capture("$pageview", { $current_url: initialUrl });
    };

    const schedule = () => {
      if ("requestIdleCallback" in globalThis) {
        (globalThis as typeof globalThis & { requestIdleCallback: (callback: () => void) => void }).requestIdleCallback(() => {
          void boot();
        });
      } else {
        globalThis.setTimeout(() => {
          void boot();
        }, 300);
      }
    };

    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!posthogKey || !enabled) return;

    const syncIdentity = async () => {
      const ph = clientRef.current;
      if (!ph) return;
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        ph.reset();
        return;
      }
      ph.identify(user.id, {
        email: user.email,
        provider: user.app_metadata?.provider,
      });
    };

    syncIdentity();
    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      syncIdentity();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!posthogKey || !enabled || !clientRef.current) return;
    const url = `${window.location.origin}${pathname}${window.location.search || ""}`;
    clientRef.current.capture("$pageview", { $current_url: url });
  }, [pathname]);

  return <>{children}</>;
}
