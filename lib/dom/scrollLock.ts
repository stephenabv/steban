/**
 * Reference-counted page scroll lock.
 *
 * Dialogs and drawers can be stacked (e.g. a delete confirmation opened from
 * inside a message dialog) and are often closed in the same render. If each
 * one saved and restored `body.style.overflow` itself, cleanup order would
 * decide the final value — and a lock taken while another was active restores
 * "hidden", leaving the page permanently unscrollable. Counting holders makes
 * the result independent of open/close order: the page unlocks only when the
 * last holder releases.
 */
let holders = 0;
let originalOverflow = "";

/** Locks page scrolling and returns an idempotent release function. */
export function acquireScrollLock(): () => void {
  if (holders === 0) {
    originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  holders += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    holders -= 1;
    if (holders === 0) document.body.style.overflow = originalOverflow;
  };
}
