"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import styles from "./RepeatableList.module.less";

interface Props<T> {
  items: T[];
  onChange: (items: T[]) => void;
  getKey: (item: T) => string;
  create: () => T;
  itemLabel: (item: T, index: number) => string;
  renderItem: (item: T, index: number, update: (patch: Partial<T>) => void) => ReactNode;
  addLabel: string;
  emptyText: string;
  max?: number;
}

/** Editable list of structured items with add, remove and reorder controls. */
export function RepeatableList<T>({
  items,
  onChange,
  getKey,
  create,
  itemLabel,
  renderItem,
  addLabel,
  emptyText,
  max = 100,
}: Props<T>) {
  const update = (index: number, patch: Partial<T>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className={styles.list}>
      {items.length === 0 && <p className={styles.empty}>{emptyText}</p>}
      <ol role="list" className={styles.items}>
        {items.map((item, index) => {
          const label = itemLabel(item, index);
          return (
            <li key={getKey(item)} className={styles.item}>
              <div className={styles.itemHeader}>
                <span className={styles.itemTitle}>{label}</span>
                <div className={styles.itemActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    icon="arrow-up"
                    aria-label={`Move ${label} up`}
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    icon="arrow-down"
                    aria-label={`Move ${label} down`}
                    disabled={index === items.length - 1}
                    onClick={() => move(index, 1)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    icon="trash"
                    aria-label={`Remove ${label}`}
                    onClick={() => remove(index)}
                  />
                </div>
              </div>
              {renderItem(item, index, (patch) => update(index, patch))}
            </li>
          );
        })}
      </ol>
      <Button variant="secondary" icon="plus" onClick={() => onChange([...items, create()])} disabled={items.length >= max}>
        {addLabel}
      </Button>
    </div>
  );
}
