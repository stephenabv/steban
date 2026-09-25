"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { Logo } from "@/components/layout/Logo";
import { Icon } from "@/components/icons/Icon";
import { useLocalPreference } from "@/lib/hooks/useLocalPreference";
import { AdminSidebar } from "./AdminSidebar";
import styles from "./AdminShell.module.less";

export function AdminShell({ basePath, children }: { basePath: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useLocalPreference("admin.sidebar.collapsed", false);
  // The drawer remembers the route it was opened on, so any navigation closes it.
  const [drawerOpenedAt, setDrawerOpenedAt] = useState<string | null>(null);
  const drawerOpen = drawerOpenedAt === pathname;
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpenedAt(null);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [drawerOpen]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push(`${basePath}/login`);
      router.refresh();
    }
  }

  return (
    <ToastProvider>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setDrawerOpenedAt(drawerOpen ? null : pathname)}
            aria-label={drawerOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={drawerOpen}
            aria-controls="admin-sidebar"
            data-mobile-only
          >
            <Icon name={drawerOpen ? "close" : "menu"} size={18} />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
            data-desktop-only
          >
            <Icon name={collapsed ? "chevrons-right" : "chevrons-left"} size={18} />
          </button>

          <Link href={basePath} className={styles.brand}>
            <Logo size={26} decorative />
            <span className={styles.brandText}>Portfolio</span>
            <span className={styles.brandBadge}>Admin</span>
          </Link>

          <div className={styles.topbarSpacer} />

          <a href="/" target="_blank" rel="noopener noreferrer" className={styles.topbarLink}>
            <Icon name="external" size={14} />
            <span>View site</span>
          </a>
        </header>

        <div className={styles.body}>
          <AdminSidebar
            basePath={basePath}
            collapsed={collapsed}
            mobileOpen={drawerOpen}
            onNavigate={() => setDrawerOpenedAt(null)}
            onSignOut={handleSignOut}
            signingOut={signingOut}
          />

          <AnimatePresence>
            {drawerOpen && (
              <motion.button
                type="button"
                className={styles.backdrop}
                aria-label="Close navigation"
                tabIndex={-1}
                onClick={() => setDrawerOpenedAt(null)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
          </AnimatePresence>

          <main className={styles.main} id="main-content" tabIndex={-1}>
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
