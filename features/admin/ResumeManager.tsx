"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RESUME_LIMITS } from "@/config/resume";
import { siteConfig } from "@/config/site";
import { formatBytes } from "@/lib/formatBytes";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/icons/Icon";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/cn";
import styles from "./ResumeManager.module.less";

/** Serialisable resume metadata passed from the Server Component. */
export interface ResumeSummary {
  fileName: string;
  sizeBytes: number;
  sha256: string;
  uploadedAt: string;
}

const uploadedFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeStyle: "short" });

/** Client-side pre-check for fast feedback; the server re-validates the bytes. */
function precheck(file: File): string | null {
  const looksLikePdf = file.type === RESUME_LIMITS.contentType || file.name.toLowerCase().endsWith(RESUME_LIMITS.extension);
  if (!looksLikePdf) return "Only PDF files are supported.";
  if (file.size === 0) return "The selected file is empty.";
  if (file.size > RESUME_LIMITS.maxBytes) {
    return `The file is ${formatBytes(file.size)}. The maximum size is ${formatBytes(RESUME_LIMITS.maxBytes)}.`;
  }
  return null;
}

export function ResumeManager({ resume }: { resume: ResumeSummary | null }) {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Version the link by content hash so the admin always opens the file just uploaded.
  const viewHref = resume ? `${siteConfig.resumePath}?v=${resume.sha256.slice(0, 12)}` : siteConfig.resumePath;

  function choose(file: File | undefined) {
    if (!file) return;
    const problem = precheck(file);
    setError(problem);
    setSelected(problem ? null : file);
  }

  function clearSelection() {
    setSelected(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function upload() {
    if (!selected) return;
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", selected);
      const res = await fetch("/api/admin/resume", { method: "POST", body });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        const message =
          data.error ??
          (res.status === 413
            ? `The file is too large. The maximum size is ${formatBytes(RESUME_LIMITS.maxBytes)}.`
            : `Upload failed (${res.status}).`);
        setError(resume ? `${message} Your current resume is unchanged.` : message);
        return;
      }
      toast.success(resume ? "Resume replaced. The website now uses the new file." : "Resume uploaded and published.");
      clearSelection();
      router.refresh();
    } catch {
      setError("Network error — the upload didn't complete." + (resume ? " Your current resume is unchanged." : ""));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={styles.stack}>
      <Card padding="lg">
        <CardHeader
          title="Current resume"
          description="Shown on the public site through the Resume button on the home page."
          actions={
            resume ? (
              <Badge tone="success" dot>
                Active
              </Badge>
            ) : (
              <Badge tone="warning" dot>
                Not published
              </Badge>
            )
          }
        />

        {resume ? (
          <div className={styles.current}>
            <span className={styles.fileIcon} aria-hidden="true">
              <Icon name="file-text" size={22} />
            </span>
            <div className={styles.fileMeta}>
              <p className={styles.fileName}>{resume.fileName}</p>
              <p className={styles.fileDetails}>
                PDF · {formatBytes(resume.sizeBytes)} · Uploaded{" "}
                <time dateTime={resume.uploadedAt}>{uploadedFormatter.format(new Date(resume.uploadedAt))}</time>
              </p>
            </div>
            <div className={styles.fileActions}>
              <Button href={viewHref} variant="secondary" icon="eye" external>
                View
              </Button>
              <Button href={`${viewHref}&download=1`} variant="ghost" icon="download" external>
                Download
              </Button>
            </div>
          </div>
        ) : (
          <Alert tone="info" title="No resume uploaded yet">
            The Resume button is hidden on the public site until you upload a PDF below.
          </Alert>
        )}
      </Card>

      <Card padding="lg">
        <CardHeader
          title={resume ? "Replace resume" : "Upload resume"}
          description={`PDF only, up to ${formatBytes(RESUME_LIMITS.maxBytes)}. ${
            resume ? "The current file stays live until the new one is saved successfully." : ""
          }`}
        />

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
            accept="application/pdf,.pdf"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => choose(e.target.files?.[0])}
          />
          <span className={styles.dropIcon} aria-hidden="true">
            <Icon name="upload" size={20} />
          </span>
          <span className={styles.dropTitle}>
            {selected ? selected.name : "Choose a PDF or drag it here"}
          </span>
          <span className={styles.dropHint}>
            {selected ? `${formatBytes(selected.size)} · ready to upload` : `Maximum ${formatBytes(RESUME_LIMITS.maxBytes)}`}
          </span>
        </label>

        <div className={styles.uploadActions}>
          {selected && !uploading && (
            <Button variant="ghost" onClick={clearSelection}>
              Cancel
            </Button>
          )}
          <Button icon="check" onClick={upload} disabled={!selected} loading={uploading} loadingText="Uploading…">
            {resume ? "Replace resume" : "Upload resume"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
