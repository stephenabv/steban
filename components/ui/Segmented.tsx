"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import styles from "./Segmented.module.less";

export interface SegmentedItem<K extends string> {
  key: K;
  label: ReactNode;
  /** Renders a navigation link (URL-driven state) instead of a toggle button. */
  href?: string;
}

interface Props<K extends string> {
  /** Accessible name of the group, e.g. "Page". */
  label: string;
  items: ReadonlyArray<SegmentedItem<K>>;
  value: K;
  onChange?: (key: K) => void;
  className?: string;
}

/** Compact segmented switcher for choosing one of a few views. */
export function Segmented<K extends string>({ label, items, value, onChange, className }: Props<K>) {
  return (
    <div className={cn(styles.group, className)} role="group" aria-label={label}>
      {items.map((item) => {
        const active = item.key === value;
        const className = cn(styles.item, active && styles.active);
        return item.href ? (
          <Link key={item.key} href={item.href} className={className} aria-current={active ? "page" : undefined}>
            {item.label}
          </Link>
        ) : (
          <button key={item.key} type="button" className={className} aria-pressed={active} onClick={() => onChange?.(item.key)}>
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
