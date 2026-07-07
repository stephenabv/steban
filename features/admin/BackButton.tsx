"use client";

import { useRouter } from "next/navigation";
import { useAdminBasePath } from "./AdminBasePathContext";
import styles from "./AdminPage.module.less";

export function BackButton({ href, label = "Back" }: { href?: string; label?: string }) {
  const router = useRouter();
  const basePath = useAdminBasePath();
  const fallback = href ?? basePath;

  function onClick() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallback);
  }

  return (
    <button type="button" className={styles.backBtn} onClick={onClick}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      {label}
    </button>
  );
}
