"use client";

import { useLayoutEffect } from "react";
import { navigationProgress } from "@/lib/navigation/NavigationProgress";
import { LoaderOverlay } from "./LoaderOverlay";

/**
 * Route loading fallback rendered by loading.tsx files.
 *
 * Rendered in place (no portal, no client-only gate) so it is part of the
 * server HTML and paints on the very first frame of a hard load, and it is
 * visible immediately — no fade-in delay that would let content win the race.
 * Registering in a layout effect hands the overlay over from NavigationLoader
 * before the browser paints, so the two never stack.
 */
export function PageLoader() {
  useLayoutEffect(() => navigationProgress.register(), []);

  return <LoaderOverlay routeFallback />;
}
