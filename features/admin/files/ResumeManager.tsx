"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { RESUME_LIMITS } from "@/config/uploads";
import { siteConfig } from "@/config/site";
import { formatBytes } from "@/lib/formatBytes";
import type { ManagedFileSummary } from "@/lib/files/ManagedFileSummary";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Icon } from "@/components/icons/Icon";
import { useToast } from "@/components/ui/ToastProvider";
import { FileDropzone } from "./FileDropzone";
import { useFileUpload } from "./useFileUpload";
import { uploadedFormatter } from "./formatters";
import styles from "./FileManager.module.less";

export function ResumeManager({ resume }: { resume: ManagedFileSummary | null }) {
  const router = useRouter();
  const toast = useToast();

  const onUploaded = useCallback(() => {
    toast.success(resume ? "Resume replaced. The website now uses the new file." : "Resume uploaded and published.");
    router.refresh();
  }, [resume, router, toast]);

  const upload = useFileUpload({
    endpoint: "/api/admin/resume",
    limits: RESUME_LIMITS,
    label: "resume",
    hasCurrent: resume !== null,
    onUploaded,
  });

  // Version the link by content hash so the admin always opens the file just uploaded.
  const viewHref = resume ? `${siteConfig.resumePath}?v=${resume.sha256.slice(0, 12)}` : siteConfig.resumePath;

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
        <FileDropzone
          upload={upload}
          limits={RESUME_LIMITS}
          prompt="Choose a PDF or drag it here"
          submitLabel={resume ? "Replace resume" : "Upload resume"}
        />
      </Card>
    </div>
  );
}
