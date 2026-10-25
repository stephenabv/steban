"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { siteConfig } from "@/config/site";
import { contactNav, isActivePath, primaryNav, tabBarNav } from "@/config/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons/Icon";
import { springSnappy } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import styles from "./Navbar.module.less";

/**
 * Facebook-style top bar (logo, icon tabs with an underline, actions) from the
 * `md` breakpoint, and an Instagram-style bottom tab bar on phones. Both are
 * plain links: no scroll listeners or menu state, so nothing here competes
 * with the visitor's input for the main thread (INP).
 */
export function Navbar() {
  const pathname = usePathname();
  const contactActive = isActivePath(pathname, contactNav.href);
  const [first, last] = siteConfig.name.split(" ");

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link href="/" className={styles.logo} aria-label={`${siteConfig.name} — home`}>
          <Logo size={36} decorative />
          <span className={styles.wordmark}>
            {first} <span>{last}</span>
          </span>
        </Link>

        {/* Only one of the two navigation landmarks is displayed at any width. */}
        <nav className={styles.tabs} aria-label="Main navigation">
          <ul role="list">
            {primaryNav.map(({ href, label, icon }) => {
              const active = isActivePath(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(styles.tab, active && styles.active)}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon name={icon} size={22} />
                    <span>{label}</span>
                    {active && (
                      <motion.span
                        layoutId="nav-active-tab"
                        className={styles.underline}
                        transition={springSnappy}
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.actions}>
          <ThemeToggle />
          <Button
            href={contactNav.href}
            size="sm"
            variant={contactActive ? "secondary" : "primary"}
            className={styles.cta}
            aria-current={contactActive ? "page" : undefined}
          >
            {contactNav.label}
          </Button>
        </div>
      </div>

      <nav className={styles.tabBar} aria-label="Main navigation" data-tabbar="">
        <ul role="list">
          {tabBarNav.map(({ href, label, icon }) => {
            const active = isActivePath(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(styles.tabBarLink, active && styles.active)}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <motion.span
                      layoutId="tabbar-active"
                      className={styles.tabBarIndicator}
                      transition={springSnappy}
                      aria-hidden="true"
                    />
                  )}
                  <Icon name={icon} size={22} />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
