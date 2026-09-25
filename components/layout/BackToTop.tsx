"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons/Icon";
import { cn } from "@/lib/cn";
import styles from "./BackToTop.module.less";

/** Scroll distance (px) after which the button appears — roughly one screen of content. */
const SHOW_AFTER = 480;

/**
 * Floating "back to top" control, pinned bottom-right with a comfortable inset
 * (respecting device safe areas). Hidden until the visitor has scrolled; when
 * hidden it uses `visibility: hidden`, so it also leaves the tab order.
 */
export function BackToTop({ targetId = "main-content" }: { targetId?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setVisible(window.scrollY > SHOW_AFTER);
    };
    const onScroll = () => {
      frame ||= window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  function scrollToTop() {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    // Move keyboard focus to the top of the content too, without a second jump.
    document.getElementById(targetId)?.focus({ preventScroll: true });
  }

  return (
    <button
      type="button"
      className={cn(styles.button, visible && styles.visible)}
      onClick={scrollToTop}
      aria-label="Back to top"
      title="Back to top"
    >
      <Icon name="arrow-up" size={20} />
    </button>
  );
}
