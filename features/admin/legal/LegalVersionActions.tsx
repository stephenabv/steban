"use client";

import { Button } from "@/components/ui/Button";
import type { LegalCommand } from "./legalCommands";
import type { LegalVersionSummary } from "./LegalVersionDto";
import type { useLegalCommands } from "./useLegalCommands";

interface Props {
  version: LegalVersionSummary;
  commands: readonly LegalCommand[];
  runner: ReturnType<typeof useLegalCommands>;
  /** Icon-only buttons for table rows. */
  compact?: boolean;
  /** Commands shown but disabled, with the reason as their tooltip. */
  disabled?: Partial<Record<LegalCommand["id"], string>>;
}

/** Buttons for every command available to a version in its current status. */
export function LegalVersionActions({ version, commands, runner, compact = false, disabled = {} }: Props) {
  return commands
    .filter((command) => command.isAvailable(version))
    .map((command) => {
      const reason = disabled[command.id];
      const label = compact ? `${command.label} version ${version.versionNumber}` : undefined;
      return (
        <Button
          key={command.id}
          variant={compact ? (command.variant === "danger" ? "danger" : "ghost") : command.variant}
          size={compact ? "sm" : "md"}
          icon={command.icon}
          iconOnly={compact}
          aria-label={label}
          title={reason ?? label}
          disabled={Boolean(reason) || runner.anyBusy}
          loading={runner.isBusy(command, version)}
          onClick={() => runner.run(command, version)}
        >
          {compact ? null : command.label}
        </Button>
      );
    });
}
