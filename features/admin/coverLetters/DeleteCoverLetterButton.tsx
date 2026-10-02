"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ButtonVariant } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import { deleteCoverLetterAction } from "./coverLetterActions";

interface DeleteCoverLetterButtonProps {
  id: string;
  /** Names the letter in the confirmation, e.g. "Acme · Frontend Developer". */
  name: string;
  onDeleted: () => void;
  /** Icon-only in table rows, labelled elsewhere. */
  compact?: boolean;
  variant?: ButtonVariant;
}

/** Delete with confirmation; the server re-checks auth and ownership. */
export function DeleteCoverLetterButton({
  id,
  name,
  onDeleted,
  compact = false,
  variant = "ghost",
}: DeleteCoverLetterButtonProps) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onConfirm() {
    setBusy(true);
    try {
      const result = await deleteCoverLetterAction(id);
      if (!result.ok) {
        toast.error(result.error ?? "Couldn't delete the letter.");
        return;
      }
      toast.success("Cover letter deleted.");
      setOpen(false);
      onDeleted();
    } catch {
      toast.error("Something went wrong while deleting. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size="sm"
        icon="trash"
        iconOnly={compact}
        onClick={() => setOpen(true)}
        aria-label={`Delete ${name}`}
        title={compact ? "Delete" : undefined}
      >
        {compact ? undefined : "Delete"}
      </Button>
      <ConfirmModal
        open={open}
        title="Delete cover letter?"
        message={
          <>
            The letter for <strong>{name}</strong> and its saved job description will be removed.
            This cannot be undone.
          </>
        }
        confirmLabel="Delete letter"
        danger
        busy={busy}
        onConfirm={onConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
