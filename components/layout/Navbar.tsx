"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { contactNav, isActivePath, primaryNav } from "@/config/navigation";
import { buttonClassName } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { Logo } from "./Logo";
import styles from "./Navbar.module.less";

/**
 * HUD top bar: logo, section tabs with a neon underline, and the contact
 * button. From `md` it is one row; on phones the tabs drop to an equal-width
 * second row. One navigation landmark at every width, plain links only: no
 * scroll listeners, menu state or animation library, so nothing here competes
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

        <nav className={styles.tabs} aria-label="Main navigation">
          <ul role="list">
            {primaryNav.map(({ href, label }) => {
              const active = isActivePath(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={cn(styles.tab, active && styles.active)}
                    aria-current={active ? "page" : undefined}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Link
          href={contactNav.href}
          className={cn(buttonClassName({ variant: contactActive ? "secondary" : "primary", size: "sm" }), styles.cta)}
          aria-current={contactActive ? "page" : undefined}
        >
          <span className={styles.ctaLong}>{contactNav.label}</span>
          <span className={styles.ctaShort}>{contactNav.shortLabel}</span>
        </Link>
      </div>
    </header>
  );
}
