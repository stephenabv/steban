"use client";

import { useState } from "react";
import { acceptAttribute, type UploadLimits } from "@/config/uploads";
import { formatBytes } from "@/lib/formatBytes";
import { cn } from "@/lib/cn";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons/Icon";
import type { FileUpload } from "./useFileUpload";
import styles from "./FileManager.module.less";

interface Props {
  upload: FileUpload;
  limits: UploadLimits;
  /** Prompt shown before a file is chosen, e.g. "Choose a PDF or drag it here". */
  prompt: string;
  submitLabel: string;
}

/** Drag-and-drop file picker with inline errors and upload/cancel actions. */
export function FileDropzone({ upload, limits, prompt, submitLabel }: Props) {
  const { inputRef, selected, error, uploading, choose, clear } = upload;
  const [dragging, setDragging] = useState(false);

  return (
    <>
      {error && (
        <Alert tone="danger" className={styles.error}>
          {error}
        </Alert>
      )}

      <label
        className={cn(styles.dropzone, dragging && styles.dragging, uploading && styles.busy)}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!uploading) choose(e.dataTransfer.files[0]);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttribute(limits)}
          className="sr-only"
          disabled={uploading}
          onChange={(e) => choose(e.target.files?.[0])}
        />
        <span className={styles.dropIcon} aria-hidden="true">
          <Icon name="upload" size={20} />
        </span>
        <span className={styles.dropTitle}>{selected ? selected.name : prompt}</span>
        <span className={styles.dropHint}>
          {selected
            ? `${formatBytes(selected.size)} · ready to upload`
            : `${limits.typeLabel} · maximum ${formatBytes(limits.maxBytes)}`}
        </span>
      </label>

      <div className={styles.uploadActions}>
        {selected && !uploading && (
          <Button variant="ghost" onClick={clear}>
            Cancel
          </Button>
        )}
        <Button icon="check" onClick={() => void upload.upload()} disabled={!selected} loading={uploading} loadingText="Uploading…">
          {submitLabel}
        </Button>
      </div>
    </>
  );
}
