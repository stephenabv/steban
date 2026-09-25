"use client";

import { MotionConfig } from "framer-motion";

/**
 * Honours the OS "reduce motion" setting for every Framer Motion animation:
 * transform/layout animations are skipped, opacity fades remain. Components
 * must not branch their *rendered output* on `useReducedMotion()` — it is
 * `null` during SSR and would cause hydration mismatches.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
