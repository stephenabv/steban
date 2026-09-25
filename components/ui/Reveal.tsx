"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Reveal.module.less";

export interface RevealProps {
  children: ReactNode;
  /** Seconds to wait after entering the viewport — use for simple staggers. */
  delay?: number;
  as?: "div" | "section" | "li" | "article";
  className?: string;
}

/**
 * Progressive-enhancement scroll reveal. Content is visible in the server HTML
 * (no-JS visitors and crawlers see everything); after hydration, only elements
 * still below the fold are hidden and then faded up as they scroll into view.
 * Motion is disabled by CSS under `prefers-reduced-motion`.
 */
export function Reveal({ children, delay = 0, as: Tag = "div", className }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // already on screen

    el.classList.add(styles.pending);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add(styles.visible);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const style = delay ? ({ "--reveal-delay": `${delay}s` } as CSSProperties) : undefined;

  return (
    <Tag ref={ref as never} className={cn(styles.reveal, className)} style={style}>
      {children}
    </Tag>
  );
}
