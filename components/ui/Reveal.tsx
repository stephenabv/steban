"use client";

import type { ElementType, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

export interface RevealProps {
  children: ReactNode;
  /** Seconds to wait after entering the viewport — use for simple staggers. */
  delay?: number;
  /** Vertical travel in px. */
  distance?: number;
  as?: "div" | "section" | "li" | "article";
  className?: string;
}

const MOTION_TAGS: Record<NonNullable<RevealProps["as"]>, ElementType> = {
  div: motion.div,
  section: motion.section,
  li: motion.li,
  article: motion.article,
};

/**
 * Fades content up the first time it scrolls into view. Renders statically
 * when the user prefers reduced motion.
 */
export function Reveal({ children, delay = 0, distance = 24, as = "div", className }: RevealProps) {
  const reduceMotion = useReducedMotion();
  const Tag = MOTION_TAGS[as];

  if (reduceMotion) {
    const Static = as;
    return <Static className={className}>{children}</Static>;
  }

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT }}
    >
      {children}
    </Tag>
  );
}
