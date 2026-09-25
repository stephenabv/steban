import { createHash } from "crypto";
import type { UploadLimits } from "@/config/uploads";
import { formatBytes } from "@/lib/formatBytes";

/** A file format recognised from its bytes. */
export interface DetectedFormat {
  contentType: string;
  /** Canonical extension, including the dot, applied to the stored file name. */
  extension: string;
}

export type FileValidation =
  | { ok: true; fileName: string; contentType: string; sha256: string }
  | { ok: false; error: string };

/**
 * Template for upload validation. Subclasses only decide which formats are
 * acceptable by inspecting the bytes (`detect`); size limits, name
 * sanitisation and hashing are shared.
 *
 * The browser-supplied MIME type and extension are never trusted.
 */
export abstract class FilePolicy {
  constructor(readonly limits: UploadLimits) {}

  /** Returns the detected format, or a user-facing error message. */
  protected abstract detect(content: Buffer): DetectedFormat | string;

  validate(fileName: string, content: Buffer): FileValidation {
    if (content.length === 0) {
      return { ok: false, error: "The selected file is empty." };
    }
    if (content.length > this.limits.maxBytes) {
      return { ok: false, error: `The file is too large. The maximum size is ${formatBytes(this.limits.maxBytes)}.` };
    }
    const format = this.detect(content);
    if (typeof format === "string") return { ok: false, error: format };

    return {
      ok: true,
      fileName: this.sanitizeFileName(fileName, format.extension),
      contentType: format.contentType,
      sha256: createHash("sha256").update(content).digest("hex"),
    };
  }

  /**
   * Keeps a readable original name for display and Content-Disposition while
   * stripping paths, control characters and header-breaking quotes, and forces
   * the extension that matches the detected content.
   */
  sanitizeFileName(raw: string, extension: string): string {
    const base = raw.split(/[\\/]/).pop() ?? "";
    const cleaned = base
      .replace(/[\u0000-\u001f\u007f"<>|:*?]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const stem = cleaned
      .replace(/\.[a-z0-9]{1,5}$/i, "")
      .slice(0, this.limits.maxFileNameLength - extension.length)
      .trim();
    return `${stem || this.limits.fallbackName}${extension}`;
  }
}

/** True when `content` begins with `signature` at `offset`. */
export function hasBytes(content: Buffer, signature: Buffer, offset = 0): boolean {
  return content.length >= offset + signature.length && content.subarray(offset, offset + signature.length).equals(signature);
}

/** True when `marker` occurs within the last `window` bytes. */
export function endsNear(content: Buffer, marker: Buffer, window: number): boolean {
  return content.subarray(Math.max(0, content.length - window)).indexOf(marker) !== -1;
}
