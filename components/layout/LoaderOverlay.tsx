import { Logo } from "./Logo";
import styles from "./PageLoader.module.less";

interface LoaderOverlayProps {
  /**
   * Marks the overlay as a route loading fallback so the `.route-page`
   * wrapper holds its enter animation while it is on screen.
   */
  readonly routeFallback?: boolean;
}

/** Branded full-viewport splash. Presentational only — callers decide when it shows. */
export function LoaderOverlay({ routeFallback = false }: LoaderOverlayProps) {
  return (
    <div
      className={styles.overlay}
      role="status"
      aria-live="polite"
      data-route-loader={routeFallback ? "" : undefined}
    >
      <div className={styles.topBar} aria-hidden="true">
        <div className={styles.topBarProgress} />
      </div>
      <div className={styles.mark} aria-hidden="true">
        <Logo size={44} decorative />
      </div>
      <p className={styles.text}>Loading…</p>
    </div>
  );
}
