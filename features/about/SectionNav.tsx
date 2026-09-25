"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import styles from "./AboutContent.module.less";

export interface SectionNavItem {
  id: string;
  label: string;
}

/** Sticky in-page navigation that highlights the section currently in view. */
export function SectionNav({ items }: { items: SectionNavItem[] }) {
  const [activeId, setActiveId] = useState(items[0]?.id);

  useEffect(() => {
    const targets = items
      .map(({ id }) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      // A band across the upper third of the viewport decides the "current" section.
      { rootMargin: "-20% 0px -65% 0px" }
    );

    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className={styles.sectionNav} aria-label="On this page">
      <p className={styles.sectionNavTitle}>On this page</p>
      <ul role="list">
        {items.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={cn(styles.sectionNavLink, activeId === id && styles.sectionNavActive)}
              aria-current={activeId === id ? "location" : undefined}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
