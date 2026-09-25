"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/icons/Icon";
import type { IconName } from "@/components/icons/Icon";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/cn";
import styles from "./Toast.module.less";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const AUTO_DISMISS_MS: Record<ToastVariant, number> = {
  success: 4000,
  info: 5000,
  // Errors stay longer so they can be read before disappearing.
  error: 7000,
};

const MAX_VISIBLE = 4;

const ICONS: Record<ToastVariant, IconName> = {
  success: "check-circle",
  error: "alert",
  info: "info",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const isClient = useIsClient();

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, variant }].slice(-MAX_VISIBLE));
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS[variant]);
    },
    [dismiss]
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message: string) => push("success", message),
      error: (message: string) => push("error", message),
      info: (message: string) => push("info", message),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {isClient &&
        createPortal(
          <div className={styles.viewport} role="region" aria-label="Notifications">
            <AnimatePresence initial={false}>
              {toasts.map((t) => (
                <motion.div
                  key={t.id}
                  layout
                  className={cn(styles.toast, styles[t.variant])}
                  role={t.variant === "error" ? "alert" : "status"}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: EASE_OUT } }}
                  exit={{ opacity: 0, x: 24, transition: { duration: 0.15 } }}
                >
                  <span className={styles.icon}>
                    <Icon name={ICONS[t.variant]} size={18} />
                  </span>
                  <span className={styles.message}>{t.message}</span>
                  <button
                    type="button"
                    className={styles.dismiss}
                    aria-label="Dismiss notification"
                    onClick={() => dismiss(t.id)}
                  >
                    <Icon name="close" size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider.");
  }
  return ctx;
}
