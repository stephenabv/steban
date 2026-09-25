"use client";

import { createPortal } from "react-dom";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { Logo } from "./Logo";
import styles from "./PageLoader.module.less";

/**
 * Route-transition fallback rendered by loading.tsx files: a branded,
 * full-viewport splash. Portalled to <body> so the route-enter animation on
 * the page wrapper can't reposition it, and faded in after a short delay so
 * fast navigations never flash it.
 */
export function PageLoader() {
  const isClient = useIsClient();
  if (!isClient) return null;

  return createPortal(
    <div className={styles.overlay} role="status" aria-live="polite">
      <div className={styles.topBar} aria-hidden="true">
        <div className={styles.topBarProgress} />
      </div>
      <div className={styles.mark} aria-hidden="true">
        <Logo size={44} decorative />
      </div>
      <p className={styles.text}>Loading…</p>
    </div>,
    document.body
  );
}
