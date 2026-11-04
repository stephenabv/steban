"use client";

import { useEffect } from "react";
import { isContentElement, type ProbeElement } from "@/lib/backdrop/contentProbe";

/** How often glyph positions are checked. Low enough to cost nothing per frame. */
const PROBE_INTERVAL_MS = 200;

/** Points inside each glyph's box that are tested, as fractions of its size. */
const SAMPLE_POINTS: readonly (readonly [number, number])[] = [
  [0.5, 0.5],
  [0.25, 0.25],
  [0.75, 0.25],
  [0.25, 0.75],
  [0.75, 0.75],
];

const OVER_ATTRIBUTE = "data-over";

function readStyle(element: ProbeElement) {
  return window.getComputedStyle(element as unknown as Element);
}

function isOverContent(glyph: HTMLElement): boolean {
  const box = glyph.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return false;
  return SAMPLE_POINTS.some(([fx, fy]) => {
    const x = box.left + box.width * fx;
    const y = box.top + box.height * fy;
    if (x < 0 || y < 0 || x >= window.innerWidth || y >= window.innerHeight) return false;
    // The backdrop takes no pointer events, so hit testing sees straight through it.
    return isContentElement(document.elementFromPoint(x, y), readStyle);
  });
}

/**
 * Marks each backdrop glyph with `data-over` while it sits over page content,
 * so the stylesheet can fade it there. Renders nothing; pauses while the
 * tab is hidden.
 */
export function TechBackdropSensor() {
  useEffect(() => {
    const layer = document.querySelector<HTMLElement>("[data-tech-backdrop]");
    if (!layer) return;
    const glyphs = Array.from(layer.querySelectorAll<HTMLElement>("[data-glyph]"));
    let timer: number | undefined;

    const probe = () => {
      for (const glyph of glyphs) {
        if (glyph.offsetParent === null) continue; // hidden at this breakpoint
        const over = isOverContent(glyph);
        if (over !== glyph.hasAttribute(OVER_ATTRIBUTE)) glyph.toggleAttribute(OVER_ATTRIBUTE, over);
      }
    };

    const start = () => {
      if (timer === undefined && document.visibilityState === "visible") {
        probe();
        timer = window.setInterval(probe, PROBE_INTERVAL_MS);
      }
    };
    const stop = () => {
      if (timer !== undefined) window.clearInterval(timer);
      timer = undefined;
    };
    const onVisibility = () => (document.visibilityState === "visible" ? start() : stop());

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
