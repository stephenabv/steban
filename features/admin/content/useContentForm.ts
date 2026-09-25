"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";
import type { ContentActionResult } from "../contentActions";
import { isAdminSessionExpired } from "@/lib/admin/sessionProbe";

export interface ContentForm<T> {
  values: T;
  setValues: (update: (current: T) => T) => void;
  /** Shallow-merges top-level fields. */
  patch: (fields: Partial<T>) => void;
  /** Dotted-path server errors, e.g. errors["experience.0.company"]. */
  errors: Record<string, string>;
  formError: string | null;
  /** True when the last save failed because the admin session ended. */
  sessionExpired: boolean;
  saving: boolean;
  savedAt: string | null;
  isDirty: boolean;
  submit: () => Promise<void>;
  /** Replace values and baseline (e.g. switching the edited SEO page). */
  reset: (values: T, savedAt: string | null) => void;
}

/**
 * State for an admin content editor bound to a Server Action. Dirty tracking
 * compares against the last saved snapshot, and leaving the page with unsaved
 * edits asks for confirmation.
 */
export function useContentForm<T>(
  initial: T,
  initialSavedAt: string | null,
  action: (values: T) => Promise<ContentActionResult>,
  successMessage: string
): ContentForm<T> {
  const router = useRouter();
  const toast = useToast();
  const [values, setValuesState] = useState(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(initialSavedAt);

  const isDirty = JSON.stringify(values) !== baseline;

  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const setValues = useCallback((update: (current: T) => T) => setValuesState(update), []);
  const patch = useCallback((fields: Partial<T>) => setValuesState((v) => ({ ...v, ...fields })), []);

  const reset = useCallback((next: T, nextSavedAt: string | null) => {
    setValuesState(next);
    setBaseline(JSON.stringify(next));
    setErrors({});
    setFormError(null);
    setSavedAt(nextSavedAt);
  }, []);

  async function submit() {
    setSaving(true);
    setFormError(null);
    setSessionExpired(false);
    try {
      const result = await action(values);
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error ?? "Couldn't save. Please try again.");
        toast.error(result.error ?? "Couldn't save. Please try again.");
        return;
      }
      setErrors({});
      setBaseline(JSON.stringify(values));
      setSavedAt(result.savedAt ?? new Date().toISOString());
      toast.success(successMessage);
      router.refresh();
    } catch {
      if (await isAdminSessionExpired()) {
        setSessionExpired(true);
        setFormError("Your session has expired, so nothing was saved.");
        toast.error("Session expired — sign in again to save.");
      } else {
        setFormError("Network error — your changes weren't saved. Please try again.");
        toast.error("Network error — your changes weren't saved.");
      }
    } finally {
      setSaving(false);
    }
  }

  return { values, setValues, patch, errors, formError, sessionExpired, saving, savedAt, isDirty, submit, reset };
}
