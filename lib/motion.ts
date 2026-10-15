import type { BezierDefinition, Transition } from "framer-motion";

/** Shared easing — keep in sync with `@ease-out` in styles/variables.less. */
export const EASE_OUT: BezierDefinition = [0.22, 1, 0.36, 1];

export const DURATION = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.45,
} as const;

export const springSnappy: Transition = { type: "spring", stiffness: 420, damping: 36, mass: 0.8 };
