"use client";

import { useState } from "react";
import type { GeneratorStrategy, LetterLength, LetterTone } from "@/server/domain/coverLetter";
import type { RegenerateCoverLetterInput } from "@/server/security/coverLetterSchemas";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Select } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { LENGTH_LABELS, STRATEGY_LABELS, TONE_LABELS, optionsOf } from "./coverLetterOptions";
import styles from "./CoverLetters.module.less";

interface RegenerateModalProps {
  open: boolean;
  initial: RegenerateCoverLetterInput;
  strategies: readonly GeneratorStrategy[];
  /** Unsaved edits are replaced, so the dialog says so. */
  hasUnsavedEdits: boolean;
  busy: boolean;
  onClose: () => void;
  onConfirm: (options: RegenerateCoverLetterInput) => void;
}

export function RegenerateModal({
  open,
  initial,
  strategies,
  hasUnsavedEdits,
  busy,
  onClose,
  onConfirm,
}: RegenerateModalProps) {
  const [options, setOptions] = useState(initial);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Regenerate letter"
      description="Writes a fresh letter from the same job details."
      dismissible={!busy}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            icon="refresh"
            loading={busy}
            loadingText="Regenerating…"
            onClick={() => onConfirm(options)}
          >
            Regenerate
          </Button>
        </>
      }
    >
      {hasUnsavedEdits && <Alert tone="warning" title="Your unsaved edits will be replaced" />}
      <div className={styles.choiceGrid}>
        <Field label="Tone">
          <Select
            value={options.tone}
            onChange={(e) => setOptions({ ...options, tone: e.target.value as LetterTone })}
          >
            {optionsOf(TONE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Length">
          <Select
            value={options.length}
            onChange={(e) => setOptions({ ...options, length: e.target.value as LetterLength })}
          >
            {optionsOf(LENGTH_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Generator">
          <Select
            value={options.strategy}
            disabled={strategies.length < 2}
            onChange={(e) =>
              setOptions({ ...options, strategy: e.target.value as GeneratorStrategy })
            }
          >
            {strategies.map((value) => (
              <option key={value} value={value}>
                {STRATEGY_LABELS[value]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
