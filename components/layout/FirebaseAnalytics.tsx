"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { Analytics } from "firebase/analytics";

/** Upper bound on how long the SDK waits for an idle slot before loading anyway. */
const IDLE_TIMEOUT_MS = 4_000;

let analyticsPromise: Promise<Analytics | null> | null = null;

/** Resolves once the page has loaded and the main thread is idle. */
function whenIdle(): Promise<void> {
  return new Promise((resolve) => {
    const schedule = () =>
      "requestIdleCallback" in window
        ? window.requestIdleCallback(() => resolve(), { timeout: IDLE_TIMEOUT_MS })
        : setTimeout(resolve, 1);
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
  });
}

/**
 * Loads the Firebase SDK (and the gtag.js it injects) once, after the page is
 * interactive. Importing it statically put ~150 KiB of analytics JavaScript in
 * the critical path of every public page; deferring it keeps it off the
 * metrics users feel (LCP, TBT) while every page view is still recorded.
 */
function loadAnalytics(): Promise<Analytics | null> {
  analyticsPromise ??= whenIdle()
    .then(() => Promise.all([import("firebase/analytics"), import("@/lib/firebase")]))
    .then(async ([{ getAnalytics, isSupported }, { firebaseApp }]) =>
      (await isSupported()) ? getAnalytics(firebaseApp) : null
    )
    .catch((error: unknown) => {
      // Analytics must never break the page (e.g. blocked by an ad blocker).
      console.warn("[analytics] disabled:", error);
      return null;
    });
  return analyticsPromise;
}

export function FirebaseAnalytics() {
  const pathname = usePathname();

  // Every route change is logged, including those made before the SDK loads.
  useEffect(() => {
    void loadAnalytics().then(async (analytics) => {
      if (!analytics) return;
      const { logEvent } = await import("firebase/analytics");
      logEvent(analytics, "page_view", { page_path: pathname });
    });
  }, [pathname]);

  return null;
}
