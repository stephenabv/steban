"use client";

import { useEffect, useMemo, useState } from "react";
import { CoverLetterLifecycle, LetterText } from "@/server/domain/coverLetter";
import type { CoverLetterAction } from "@/server/domain/coverLetter";
import type { RegenerateCoverLetterInput } from "@/server/security/coverLetterSchemas";
import { useToast } from "@/components/ui/ToastProvider";
import {
  finalizeCoverLetterAction,
  regenerateCoverLetterAction,
  reopenCoverLetterAction,
  saveCoverLetterAction,
} from "./coverLetterActions";
import type { CoverLetterActionResult } from "./coverLetterActions";
import type { CoverLetterView } from "./CoverLetterDto";
import { CoverLetterDraft } from "./CoverLetterDraft";
import type { CoverLetterDraftValues } from "./CoverLetterDraft";

export type EditorOperation = "save" | "finalize" | "reopen" | "regenerate";

const UNEXPECTED = "Something went wrong. Please try again.";

/**
 * Editor state for one letter: the saved view, the unsaved draft, and the
 * server actions that move it through its lifecycle.
 */
export function useCoverLetterEditor(initial: CoverLetterView) {
  const toast = useToast();
  const [letter, setLetter] = useState(initial);
  const [draft, setDraft] = useState<CoverLetterDraftValues>(() =>
    CoverLetterDraft.fromSections(initial.sections)
  );
  const [pending, setPending] = useState<EditorOperation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [notices, setNotices] = useState<string[]>([]);

  const saved = useMemo(() => CoverLetterDraft.fromSections(letter.sections), [letter.sections]);
  const dirty = !CoverLetterDraft.equals(draft, saved);
  const sections = useMemo(
    () => CoverLetterDraft.applyTo(letter.sections, draft),
    [letter.sections, draft]
  );
  const wordCount = LetterText.bodyWordCount(sections.body);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /** Replaces the saved letter and discards the draft. */
  function load(next: CoverLetterView) {
    setLetter(next);
    setDraft(CoverLetterDraft.fromSections(next.sections));
    setFieldErrors({});
  }

  async function run<T>(
    operation: EditorOperation,
    call: () => Promise<CoverLetterActionResult<T>>,
    onSuccess: (data: T) => void
  ): Promise<boolean> {
    setPending(operation);
    setError(null);
    try {
      const result = await call();
      if (!result.ok || result.data === undefined) {
        setFieldErrors(result.fieldErrors ?? {});
        setError(result.error ?? UNEXPECTED);
        return false;
      }
      onSuccess(result.data);
      return true;
    } catch {
      setError(UNEXPECTED);
      return false;
    } finally {
      setPending(null);
    }
  }

  return {
    letter,
    draft,
    sections,
    wordCount,
    dirty,
    pending,
    error,
    fieldErrors,
    warnings,
    notices,
    can: (action: CoverLetterAction) => CoverLetterLifecycle.can(letter.status, action),

    setDate: (date: string) => setDraft((current) => ({ ...current, date })),
    setSalutation: (salutation: string) => setDraft((current) => ({ ...current, salutation })),
    setParagraph: (index: number, text: string) =>
      setDraft((current) => ({
        ...current,
        body: current.body.map((paragraph, i) => (i === index ? text : paragraph)),
      })),
    discard: () => setDraft(saved),

    save: () =>
      run(
        "save",
        () => saveCoverLetterAction(letter.id, CoverLetterDraft.toInput(draft)),
        (data) => {
          load(data.letter);
          setWarnings(data.warnings);
          toast.success("Draft saved.");
        }
      ),
    finalize: () =>
      run(
        "finalize",
        () => finalizeCoverLetterAction(letter.id),
        (data) => {
          load(data);
          toast.success("Marked as final.");
        }
      ),
    reopen: () =>
      run(
        "reopen",
        () => reopenCoverLetterAction(letter.id),
        (data) => {
          load(data);
          toast.info("Reopened as a draft.");
        }
      ),
    regenerate: (options: RegenerateCoverLetterInput) =>
      run(
        "regenerate",
        () => regenerateCoverLetterAction(letter.id, options),
        (data) => {
          load(data.letter);
          setWarnings([]);
          setNotices(data.notices);
          toast.success("Letter regenerated.");
        }
      ),
    async copy(): Promise<void> {
      try {
        await navigator.clipboard.writeText(LetterText.toPlainText(sections));
        toast.success("Copied to clipboard.");
      } catch {
        toast.error("Your browser blocked clipboard access.");
      }
    },
  };
}

export type CoverLetterEditorState = ReturnType<typeof useCoverLetterEditor>;
