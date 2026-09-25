"use client";

import { useId, useRef } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/icons/Icon";
import { useFocusTrap } from "@/lib/hooks/useFocusTrap";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/cn";
import styles from "./Modal.module.less";

export type ModalSize = "sm" | "md" | "lg";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  /** Set to false while a blocking operation is in flight. */
  dismissible?: boolean;
}

/**
 * Accessible dialog: portal-mounted, focus-trapped, Escape/backdrop dismissal,
 * animated in and out, and presented as a bottom sheet on small screens.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
}: ModalProps) {
  const isClient = useIsClient();
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  const requestClose = () => {
    if (dismissible) onClose();
  };

  useFocusTrap(dialogRef, { active: open, onEscape: requestClose });

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className={styles.overlay}>
          <motion.button
            type="button"
            className={styles.backdrop}
            aria-label="Close dialog"
            tabIndex={-1}
            onClick={requestClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
          <motion.div
            ref={dialogRef}
            className={cn(styles.dialog, styles[size])}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: EASE_OUT } }}
            exit={{ opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.16 } }}
          >
            <div className={styles.grabber} aria-hidden="true" />
            <div className={styles.header}>
              <div>
                <h2 id={titleId} className={styles.title}>
                  {title}
                </h2>
                {description && (
                  <p id={descriptionId} className={styles.description}>
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={requestClose}
                disabled={!dismissible}
                aria-label="Close dialog"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className={styles.body}>{children}</div>
            {footer && <div className={styles.footer}>{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/** Pushes footer content to the start edge (e.g. a destructive action). */
export function ModalFooterStart({ children }: { children: ReactNode }) {
  return <div className={styles.footerStart}>{children}</div>;
}
