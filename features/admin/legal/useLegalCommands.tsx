"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import type { LegalCommand, LegalCommandContext } from "./legalCommands";
import type { LegalVersionSummary } from "./LegalVersionDto";

interface Pending {
  command: LegalCommand;
  version: LegalVersionSummary;
}

/**
 * Runs legal commands with a shared confirmation dialog, busy state and toast
 * feedback. Render `dialog` once wherever the hook is used.
 */
export function useLegalCommands(ctx: LegalCommandContext) {
  const router = useRouter();
  const toast = useToast();
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function execute(command: LegalCommand, version: LegalVersionSummary) {
    setBusy(`${command.id}:${version.id}`);
    try {
      const result = await command.execute(version);
      if (!result.ok) {
        toast.error(result.error ?? "Something went wrong. Please try again.");
        return;
      }
      toast.success(command.successMessage(version));
      setPending(null);
      const destination = command.destination?.(result, version, ctx);
      if (destination) router.push(destination);
      else router.refresh();
    } catch {
      toast.error("Network error — nothing was changed. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  function run(command: LegalCommand, version: LegalVersionSummary) {
    if (command.confirmation) setPending({ command, version });
    else void execute(command, version);
  }

  const confirmation = pending?.command.confirmation?.(pending.version, ctx);
  const dialog = (
    <ConfirmModal
      open={pending !== null}
      title={confirmation?.title ?? ""}
      message={confirmation?.message ?? ""}
      confirmLabel={confirmation?.confirmLabel}
      danger={confirmation?.danger}
      busy={busy !== null}
      onConfirm={() => pending && void execute(pending.command, pending.version)}
      onCancel={() => setPending(null)}
    />
  );

  const isBusy = (command: LegalCommand, version: LegalVersionSummary) => busy === `${command.id}:${version.id}`;

  return { run, dialog, isBusy, anyBusy: busy !== null };
}
