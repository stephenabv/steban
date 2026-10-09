"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/icons/Icon";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/cn";
import { PaletteCatalog } from "./paletteItems";
import type { PaletteItem } from "./paletteItems";
import { useAdminSearch } from "./useAdminSearch";
import styles from "./CommandPalette.module.less";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  basePath: string;
}

/** Search-or-jump dialog: admin pages, quick actions and records in one keyboard-driven list. */
export function CommandPalette({ open, onClose, basePath }: CommandPaletteProps) {
  const isClient = useIsClient();
  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={styles.overlay}>
          <motion.button
            type="button"
            className={styles.backdrop}
            aria-label="Close search"
            tabIndex={-1}
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
          <PalettePanel onClose={onClose} basePath={basePath} />
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function PalettePanel({ onClose, basePath }: Omit<CommandPaletteProps, "open">) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const listId = useId();
  const [input, setInput] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useFocusTrap(dialogRef, { active: true, onEscape: onClose });

  const catalog = useMemo(() => new PaletteCatalog(basePath), [basePath]);
  const search = useAdminSearch(input);
  const sections = useMemo(
    () => catalog.sections(input, search.groups),
    [catalog, input, search.groups]
  );
  const items = useMemo(() => sections.flatMap((s) => s.items), [sections]);

  // The highlighted row falls back to the first one whenever results change under it.
  const active = items.find((item) => item.key === activeKey) ?? items[0] ?? null;
  const optionId = (item: PaletteItem) => `${listId}-${item.key.replace(/[^\w-]/g, "_")}`;

  useEffect(() => {
    if (!active) return;
    document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
    // optionId is derived from listId, which is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.key]);

  function go(item: PaletteItem) {
    onClose();
    router.push(item.href);
  }

  function move(offset: number) {
    if (items.length === 0) return;
    const index = active ? items.indexOf(active) : -1;
    const next = items[(index + offset + items.length) % items.length];
    setActiveKey(next.key);
  }

  function onInputKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        move(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        move(-1);
        break;
      case "Enter":
        if (active && !e.nativeEvent.isComposing) {
          e.preventDefault();
          go(active);
        }
        break;
    }
  }

  const hasQuery = input.trim().length > 0;
  const status = search.error
    ? search.error
    : search.loading
      ? "Searching…"
      : hasQuery
        ? `${items.length} result${items.length === 1 ? "" : "s"}`
        : "";

  return (
    <motion.div
      ref={dialogRef}
      className={styles.dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      initial={{ opacity: 0, y: -8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: EASE_OUT } }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
    >
      <h2 id={titleId} className="sr-only">
        Search admin
      </h2>

      <div className={styles.field}>
        <Icon name="search" size={18} className={styles.fieldIcon} />
        <input
          className={styles.input}
          type="text"
          role="combobox"
          aria-label="Search pages, projects, messages and letters"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active ? optionId(active) : undefined}
          placeholder="Search or jump to…"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="go"
          maxLength={80}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setActiveKey(null);
          }}
          onKeyDown={onInputKeyDown}
        />
        {search.loading && <span className={styles.spinner} aria-hidden="true" />}
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close search">
          <kbd className={styles.escKey}>Esc</kbd>
          <Icon name="close" size={18} className={styles.closeIcon} />
        </button>
      </div>

      <div id={listId} role="listbox" aria-label="Results" className={styles.results}>
        {sections.map((section) => (
          <div
            key={section.id}
            role="group"
            aria-labelledby={`${listId}-${section.id}`}
            className={styles.section}
          >
            <div id={`${listId}-${section.id}`} className={styles.sectionLabel}>
              {section.label}
            </div>
            {section.items.map((item) => (
              <Link
                key={item.key}
                id={optionId(item)}
                href={item.href}
                prefetch={false}
                role="option"
                aria-selected={item === active}
                tabIndex={-1}
                className={cn(styles.option, item === active && styles.optionActive)}
                onMouseMove={() => item !== active && setActiveKey(item.key)}
                onClick={onClose}
              >
                <span className={styles.optionIcon} aria-hidden="true">
                  <Icon name={item.icon} size={16} />
                </span>
                <span className={styles.optionText}>
                  <span className={styles.optionTitle}>{item.title}</span>
                  {item.subtitle && <span className={styles.optionSub}>{item.subtitle}</span>}
                </span>
                {item.badge && <span className={styles.badge}>{item.badge}</span>}
                <Icon name="arrow-right" size={14} className={styles.optionGo} />
              </Link>
            ))}
          </div>
        ))}

        {hasQuery && !search.loading && items.length === 0 && !search.error && (
          <p className={styles.empty}>
            No matches for <strong>“{input.trim()}”</strong>. Try a project name, sender, company or
            page.
          </p>
        )}
        {search.unavailable.length > 0 && (
          <p className={styles.notice}>
            Couldn&apos;t search {search.unavailable.join(", ").toLowerCase()} right now.
          </p>
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.hints} aria-hidden="true">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> to move
          </span>
          <span>
            <kbd>↵</kbd> to open
          </span>
        </span>
        <span
          role="status"
          aria-live="polite"
          className={cn(styles.status, search.error && styles.statusError)}
        >
          {status}
        </span>
      </div>
    </motion.div>
  );
}
