import styles from "./PageLoader.module.less";

/**
 * Route-transition fallback rendered by loading.tsx files.
 * A full-viewport splash overlay (fixed, above navbars/modals/toasts) so it's
 * always the topmost thing on screen regardless of where it lands in the DOM.
 */
export function PageLoader() {
  return (
    <div className={styles.overlay} role="status" aria-live="polite" aria-label="Loading page">
      <div className={styles.topBar}>
        <div className={styles.topBarProgress} />
      </div>
      <div className={styles.spinner} aria-hidden="true" />
      <p className={styles.text}>Loading…</p>
    </div>
  );
}
