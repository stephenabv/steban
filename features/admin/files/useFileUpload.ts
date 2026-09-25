"use client";

import { useCallback, useRef, useState } from "react";
import type { UploadLimits } from "@/config/uploads";
import { formatBytes } from "@/lib/formatBytes";
import type { ManagedFileSummary } from "@/lib/files/ManagedFileSummary";

export interface FileUploadOptions {
  /** Admin Route Handler that accepts `multipart/form-data` with a `file` field. */
  endpoint: string;
  limits: UploadLimits;
  /** Lower-case noun for messages, e.g. "resume". */
  label: string;
  /** Whether a file is live now — failures then reassure that it's unchanged. */
  hasCurrent: boolean;
  onUploaded: (file: ManagedFileSummary) => void;
}

export interface FileUpload {
  inputRef: React.RefObject<HTMLInputElement | null>;
  selected: File | null;
  error: string | null;
  uploading: boolean;
  choose: (file: File | undefined) => void;
  clear: () => void;
  upload: () => Promise<void>;
}

/** Client-side pre-check for fast feedback; the server re-validates the bytes. */
export function precheckFile(file: File, limits: UploadLimits): string | null {
  const name = file.name.toLowerCase();
  const looksAccepted =
    limits.contentTypes.includes(file.type) || limits.extensions.some((extension) => name.endsWith(extension));
  if (!looksAccepted) return `Only ${limits.typeLabel} files are supported.`;
  if (file.size === 0) return "The selected file is empty.";
  if (file.size > limits.maxBytes) {
    return `The file is ${formatBytes(file.size)}. The maximum size is ${formatBytes(limits.maxBytes)}.`;
  }
  return null;
}

function failureMessage(status: number, serverMessage: string | undefined, limits: UploadLimits): string {
  if (status === 401) return "Your session has expired. Sign in again, then retry the upload.";
  if (serverMessage) return serverMessage;
  if (status === 413) return `The file is too large. The maximum size is ${formatBytes(limits.maxBytes)}.`;
  return `Upload failed (${status}).`;
}

/** Selection, validation and upload state for a single managed file. */
export function useFileUpload({ endpoint, limits, label, hasCurrent, onUploaded }: FileUploadOptions): FileUpload {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const unchanged = hasCurrent ? ` Your current ${label} is unchanged.` : "";

  const clear = useCallback(() => {
    setSelected(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const choose = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      const problem = precheckFile(file, limits);
      setError(problem);
      setSelected(problem ? null : file);
      if (problem && inputRef.current) inputRef.current.value = "";
    },
    [limits]
  );

  const upload = useCallback(async () => {
    if (!selected) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", selected);
      const res = await fetch(endpoint, { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { error?: string; file?: ManagedFileSummary };
      if (!res.ok || !data.file) {
        setError(failureMessage(res.status, data.error, limits) + unchanged);
        return;
      }
      clear();
      onUploaded(data.file);
    } catch {
      setError(`Network error — the upload didn't complete.${unchanged}`);
    } finally {
      setUploading(false);
    }
  }, [selected, endpoint, limits, unchanged, clear, onUploaded]);

  return { inputRef, selected, error, uploading, choose, clear, upload };
}
