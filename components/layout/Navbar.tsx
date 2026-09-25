"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { siteConfig } from "@/config/site";
import { contactNav, isActivePath, primaryNav } from "@/config/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons/Icon";
import { EASE_OUT, springSnappy } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";
import styles from "./Navbar.module.less";

const MOBILE_LINKS = [...primaryNav, contactNav];

export function Navbar() {
  const pathname = usePathname();
  const menuId = useId();
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [scrolled, setScrolled] = useState(false);
  // The menu remembers the route it was opened on, so navigating closes it
  // without a state-syncing effect.
  const [menuOpenedAt, setMenuOpenedAt] = useState<string | null>(null);
  const menuOpen = menuOpenedAt === pathname;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(e: PointerEvent) {
      if (!headerRef.current?.contains(e.target as Node)) setMenuOpenedAt(null);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpenedAt(null);
        toggleRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const [first, last] = siteConfig.name.split(" ");

  return (
    <header ref={headerRef} className={styles.header}>
      <nav className={cn(styles.pill, (scrolled || menuOpen) && styles.scrolled)} aria-label="Main navigation">
        <Link href="/" className={styles.logo} aria-label={`${siteConfig.name} — home`}>
          <Logo size={30} decorative />
          <span className={styles.wordmark}>
            {first} <span>{last}</span>
          </span>
        </Link>

        <ul className={styles.links} role="list">
          {primaryNav.map(({ href, label }) => {
            const active = isActivePath(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(styles.link, active && styles.active)}
                  aria-current={active ? "page" : undefined}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className={styles.activePill}
                      transition={springSnappy}
                      aria-hidden="true"
                    />
                  )}
                  <span className={styles.linkText}>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className={styles.actions}>
          <Button
            href={contactNav.href}
            size="sm"
            variant={isActivePath(pathname, contactNav.href) ? "secondary" : "primary"}
            iconRight="arrow-right"
            className={styles.cta}
            aria-current={isActivePath(pathname, contactNav.href) ? "page" : undefined}
          >
            {contactNav.label}
          </Button>

          <button
            ref={toggleRef}
            type="button"
            className={styles.menuBtn}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpenedAt(menuOpen ? null : pathname)}
          >
            <Icon name={menuOpen ? "close" : "menu"} size={20} />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id={menuId}
            className={styles.mobilePanel}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: EASE_OUT } }}
            exit={{ opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.15 } }}
          >
            <ul role="list">
              {MOBILE_LINKS.map(({ href, label }, i) => {
                const active = isActivePath(pathname, href);
                return (
                  <motion.li
                    key={href}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: 0.03 * i, duration: 0.2 } }}
                  >
                    <Link
                      href={href}
                      className={cn(styles.mobileLink, active && styles.active)}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setMenuOpenedAt(null)}
                    >
                      {label}
                      <Icon name="arrow-right" size={16} />
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
