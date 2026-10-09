"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "@/components/icons/Icon";
import { CommandPalette } from "./CommandPalette";
import styles from "./CommandPalette.module.less";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

/** Another dialog (e.g. an edit form) owns focus; don't stack the palette on it. */
function otherDialogOpen(): boolean {
  return document.querySelector('[role="dialog"][aria-modal="true"]') !== null;
}

const noopSubscribe = () => () => {};
const detectMac = () => /Mac|iPhone|iPad/.test(navigator.userAgent);

/**
 * Top-bar search: a field-styled trigger (an icon button on phones) that opens
 * the command palette. ⌘K / Ctrl+K toggles it anywhere; "/" opens it when the
 * user isn't typing in a field.
 */
export function AdminSearch({ basePath }: { basePath: string }) {
  const [open, setOpen] = useState(false);
  // Server render has no platform; show Ctrl until the browser says otherwise.
  const isMac = useSyncExternalStore(noopSubscribe, detectMac, () => false);
  // Read by the document listener, which binds once.
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.isComposing) return;
      const key = e.key.toLowerCase();
      if (key === "k" && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        if (openRef.current) setOpen(false);
        else if (!otherDialogOpen()) setOpen(true);
      } else if (
        key === "/" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !isEditableTarget(e.target) &&
        !otherDialogOpen()
      ) {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const shortcut = isMac ? "⌘K" : "Ctrl K";

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-keyshortcuts="Meta+K Control+K /"
        aria-label="Search or jump to"
      >
        <Icon name="search" size={16} className={styles.triggerIcon} />
        <span className={styles.triggerText}>Search or jump to…</span>
        <kbd className={styles.triggerKey}>{shortcut}</kbd>
      </button>
      <CommandPalette open={open} onClose={() => setOpen(false)} basePath={basePath} />
    </>
  );
}
