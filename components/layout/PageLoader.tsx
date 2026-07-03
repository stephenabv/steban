import styles from "./PageLoader.module.less";

/**
 * Route-transition fallback rendered by loading.tsx files.
 * Shows an indeterminate progress bar overlaid at the very top of the viewport
 * plus a centered spinner where the page content will appear.
 */
export function PageLoader() {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite" aria-label="Loading page">
      <div className={styles.topBar}>
        <div className={styles.topBarProgress} />
      </div>
      <div className={styles.spinner} aria-hidden="true" />
      <p className={styles.text}>Loading…</p>
    </div>
  );
}
