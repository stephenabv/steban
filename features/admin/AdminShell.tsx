"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { ToastProvider } from "@/components/ui/ToastProvider";
import styles from "./AdminShell.module.less";

export function AdminShell({ basePath, children }: { basePath: string; children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <ToastProvider>
      <div className={styles.layout}>
        <AdminSidebar basePath={basePath} mobileOpen={menuOpen} />

        {menuOpen && (
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close admin navigation"
            onClick={() => setMenuOpen(false)}
          />
        )}

        <main className={styles.main} id="main-content" tabIndex={-1}>
          <div className={styles.topbar}>
            <button
              type="button"
              className={styles.menuToggle}
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? "Close admin navigation" : "Open admin navigation"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
            <span className={styles.topbarTitle}>Admin</span>
          </div>
          <div className={styles.mainContent}>{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
