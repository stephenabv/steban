import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { acquireScrollLock } from "@/lib/dom/scrollLock";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

interface FocusTrapOptions {
  active: boolean;
  onEscape?: () => void;
  /** Lock page scroll while active (dialogs). */
  lockScroll?: boolean;
}

/**
 * Keeps keyboard focus inside `ref` while active, closes on Escape, and restores
 * focus to the previously focused element on deactivate (WAI-ARIA dialog pattern).
 */
export function useFocusTrap(ref: RefObject<HTMLElement | null>, { active, onEscape, lockScroll = true }: FocusTrapOptions) {
  // Latest-callback ref: the trap re-binds only when `active` flips, never per render.
  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!active) return;
    const container = ref.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const firstField = container.querySelector<HTMLElement>(
      "input:not([disabled]):not([type='hidden']), textarea:not([disabled]), select:not([disabled])"
    );
    (firstField ?? container).focus({ preventScroll: true });

    const releaseScroll = lockScroll ? acquireScrollLock() : undefined;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && onEscapeRef.current) {
        e.stopPropagation();
        onEscapeRef.current();
        return;
      }
      if (e.key !== "Tab" || !container) return;

      const nodes = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === container)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      releaseScroll?.();
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [active, ref, lockScroll]);
}
