"use client";

import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { navigationProgress } from "@/lib/navigation/NavigationProgress";
import { resolveNavigationTarget } from "@/lib/navigation/linkIntent";
import { LoaderOverlay } from "./LoaderOverlay";

/** Clears a navigation that never committed (aborted, errored, or a download). */
const STALL_TIMEOUT_MS = 10_000;

/**
 * Shows the loader overlay the instant an in-app link is clicked, covering the
 * gap before Next.js commits the next route (and its loading.tsx) — without
 * it, the old page stays interactive and visible until the server answers.
 *
 * Visibility is derived, not synced: the overlay shows only while the current
 * pathname still equals the one the navigation started from, so it disappears
 * in the same commit that renders the new route. Once a route fallback is on
 * screen it takes over and this one steps aside.
 */
export function NavigationLoader() {
  const pathname = usePathname();
  const { pendingFrom, routeLoaders } = useSyncExternalStore(
    navigationProgress.subscribe,
    navigationProgress.getSnapshot,
    navigationProgress.getServerSnapshot
  );

  const navigating = pendingFrom !== null && pendingFrom === pathname;

  useEffect(() => {
    // Capture phase: Next's <Link> calls preventDefault in its own handler.
    const onClick = (event: MouseEvent) => {
      if (resolveNavigationTarget(event, window.location.pathname) !== null) {
        navigationProgress.start(window.location.pathname);
      }
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  // The route committed: drop the stale origin so returning to it later
  // (e.g. browser back) doesn't re-match and resurrect the overlay.
  useEffect(() => {
    if (pendingFrom !== null && pendingFrom !== pathname) navigationProgress.cancel();
  }, [pathname, pendingFrom]);

  useEffect(() => {
    if (!navigating) return;
    const timer = setTimeout(() => navigationProgress.cancel(), STALL_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [navigating]);

  return navigating && routeLoaders === 0 ? <LoaderOverlay /> : null;
}
