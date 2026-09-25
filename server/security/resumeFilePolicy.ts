import { createHash } from "crypto";
import { RESUME_LIMITS } from "@/config/resume";
import { formatBytes } from "@/lib/formatBytes";

/** Upload rules for resume files. Server-side validation is authoritative. */
export const RESUME_POLICY = RESUME_LIMITS;

export type ResumeValidation =
  | { ok: true; fileName: string; sha256: string }
  | { ok: false; error: string };

const PDF_MAGIC = Buffer.from("%PDF-");
const PDF_EOF = Buffer.from("%%EOF");
/** The EOF marker must appear near the end; incremental updates may append a little after it. */
const EOF_SEARCH_WINDOW = 2048;

export class ResumeFilePolicy {
  static validate(fileName: string, content: Buffer): ResumeValidation {
    if (content.length === 0) {
      return { ok: false, error: "The selected file is empty." };
    }
    if (content.length > RESUME_POLICY.maxBytes) {
      return { ok: false, error: `The file is too large. The maximum size is ${formatBytes(RESUME_POLICY.maxBytes)}.` };
    }
    // Trust the bytes, not the browser-supplied MIME type or extension.
    if (!content.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
      return { ok: false, error: "Only PDF files are supported. The selected file isn't a valid PDF." };
    }
    const tail = content.subarray(Math.max(0, content.length - EOF_SEARCH_WINDOW));
    if (tail.indexOf(PDF_EOF) === -1) {
      return { ok: false, error: "The PDF appears to be incomplete or corrupted. Please export it again and retry." };
    }
    return {
      ok: true,
      fileName: ResumeFilePolicy.sanitizeFileName(fileName),
      sha256: createHash("sha256").update(content).digest("hex"),
    };
  }

  /**
   * Keeps a readable original name for display and Content-Disposition while
   * stripping paths, control characters and header-breaking quotes.
   */
  static sanitizeFileName(raw: string): string {
    const base = raw.split(/[\\/]/).pop() ?? "";
    const cleaned = base
      .replace(/[\u0000-\u001f\u007f"<>|:*?]/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const stem = cleaned.replace(/\.pdf$/i, "").slice(0, RESUME_POLICY.maxFileNameLength - RESUME_POLICY.extension.length);
    return `${stem || "resume"}${RESUME_POLICY.extension}`;
  }
}
