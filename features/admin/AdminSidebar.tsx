"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/icons/Icon";
import { cn } from "@/lib/cn";
import { adminNavigation, isAdminPathActive } from "./adminNavigation";
import styles from "./AdminShell.module.less";

interface Props {
  basePath: string;
  collapsed: boolean;
  mobileOpen: boolean;
  onNavigate: () => void;
  onSignOut: () => void;
  signingOut: boolean;
}

export function AdminSidebar({ basePath, collapsed, mobileOpen, onNavigate, onSignOut, signingOut }: Props) {
  const pathname = usePathname();

  return (
    <aside
      id="admin-sidebar"
      className={cn(styles.sidebar, collapsed && styles.collapsed, mobileOpen && styles.mobileOpen)}
      aria-label="Admin navigation"
    >
      <nav className={styles.nav}>
        {adminNavigation.map((group) => (
          <div key={group.label} className={styles.navGroup}>
            <p className={styles.navLabel}>{group.label}</p>
            <ul role="list">
              {group.items.map((item) => {
                const active = isAdminPathActive(pathname, basePath, item.path);
                return (
                  <li key={item.path}>
                    <Link
                      href={`${basePath}${item.path}`}
                      className={cn(styles.navLink, active && styles.navActive)}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                      onClick={onNavigate}
                    >
                      <Icon name={item.icon} size={18} />
                      <span className={styles.navText}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.navLink}
          title={collapsed ? "View site" : undefined}
        >
          <Icon name="external" size={18} />
          <span className={styles.navText}>View site</span>
        </a>
        <button
          type="button"
          className={cn(styles.navLink, styles.signOut)}
          onClick={onSignOut}
          disabled={signingOut}
          title={collapsed ? "Sign out" : undefined}
        >
          <Icon name="logout" size={18} />
          <span className={styles.navText}>{signingOut ? "Signing out…" : "Sign out"}</span>
        </button>
      </div>
    </aside>
  );
}
