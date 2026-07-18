"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

const POSTHOG_KEY     = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST    = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
let   initialised     = false;

function PostHogPageView() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!POSTHOG_KEY || !initialised) return;
    const url = pathname + (searchParams.toString() ? `?${searchParams}` : "");
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY || initialised) return;
    posthog.init(POSTHOG_KEY, {
      api_host:    POSTHOG_HOST,
      persistence: "memory",   // no cookies — DPDP-clean
      capture_pageview:  false, // we fire pageviews manually via PostHogPageView
      capture_pageleave: true,
      autocapture:       true,
      session_recording: { maskAllInputs: true, maskTextSelector: "[data-ph-mask]" },
    });
    initialised = true;
  }, []);

  return (
    <>
      {children}
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
    </>
  );
}
