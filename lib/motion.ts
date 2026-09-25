import type { BezierDefinition, Transition, Variants } from "framer-motion";

/** Shared easing — keep in sync with `@ease-out` in styles/variables.less. */
export const EASE_OUT: BezierDefinition = [0.22, 1, 0.36, 1];

export const DURATION = {
  fast: 0.15,
  normal: 0.25,
  slow: 0.45,
} as const;

export const springSnappy: Transition = { type: "spring", stiffness: 420, damping: 36, mass: 0.8 };

/** Fade-and-rise entrance used by hero copy and scroll reveals. */
export function fadeUp(delay = 0, distance = 24): Variants {
  return {
    hidden: { opacity: 0, y: distance },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: EASE_OUT } },
  };
}
