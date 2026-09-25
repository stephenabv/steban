"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { RESUME_LIMITS } from "@/config/uploads";
import { siteConfig } from "@/config/site";
import { formatBytes } from "@/lib/formatBytes";
import type { ManagedFileSummary } from "@/lib/files/ManagedFileSummary";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Icon } from "@/components/icons/Icon";
import { useToast } from "@/components/ui/ToastProvider";
import { FileDropzone } from "./FileDropzone";
import { useFileUpload } from "./useFileUpload";
import { useManagedFileMutations } from "./useManagedFileMutations";
import { uploadedFormatter } from "./formatters";
import styles from "./FileManager.module.less";

const ENDPOINT = "/api/admin/resume";

export function ResumeManager({ resume }: { resume: ManagedFileSummary | null }) {
  const router = useRouter();
  const toast = useToast();

  const onUploaded = useCallback(() => {
    toast.success(
      !resume
        ? "Resume uploaded and published."
        : resume.published
          ? "Resume replaced. The website now uses the new file."
          : "Resume replaced. It stays unpublished until you publish it."
    );
    router.refresh();
  }, [resume, router, toast]);

  const mutations = useManagedFileMutations({ endpoint: ENDPOINT, label: "resume" });
  const [deleteOpen, setDeleteOpen] = useState(false);

  const upload = useFileUpload({
    endpoint: ENDPOINT,
    limits: RESUME_LIMITS,
    label: "resume",
    hasCurrent: resume !== null,
    onUploaded,
  });

  // Version the link by content hash so the admin always opens the file just uploaded.
  const viewHref = resume ? `${siteConfig.resumePath}?v=${resume.sha256.slice(0, 12)}` : siteConfig.resumePath;

  async function confirmDelete() {
    if (await mutations.remove("Resume deleted. The Resume button is hidden on the site.")) setDeleteOpen(false);
  }

  return (
    <div className={styles.stack}>
      <Card padding="lg">
        <CardHeader
          title="Current resume"
          description="Visitors get it from the Resume button on the home page and at /resume.pdf while it's published."
          actions={<ResumeStatusBadge resume={resume} />}
        />

        {resume ? (
          <>
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

            {!resume.published && (
              <Alert tone="warning" title="Hidden from the website" className={styles.notice}>
                The Resume button is hidden and /resume.pdf returns “not found” to visitors. Only you can view it
                while signed in.
              </Alert>
            )}

            <div className={styles.manageActions}>
              {resume.published ? (
                <Button
                  variant="secondary"
                  icon="eye-off"
                  onClick={() => void mutations.unpublish("Resume unpublished — it's hidden from the website.")}
                  loading={mutations.pending === "unpublish"}
                  loadingText="Unpublishing…"
                  disabled={mutations.pending !== null}
                >
                  Unpublish
                </Button>
              ) : (
                <Button
                  icon="globe"
                  onClick={() => void mutations.publish("Resume published — visitors can download it again.")}
                  loading={mutations.pending === "publish"}
                  loadingText="Publishing…"
                  disabled={mutations.pending !== null}
                >
                  Publish
                </Button>
              )}
              <Button variant="danger" icon="trash" onClick={() => setDeleteOpen(true)} disabled={mutations.pending !== null}>
                Delete
              </Button>
            </div>
          </>
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
            resume
              ? `The current file stays in place until the new one is saved, and the new file keeps its ${
                  resume.published ? "published" : "unpublished"
                } status.`
              : "It's published as soon as it's uploaded."
          }`}
        />
        <FileDropzone
          upload={upload}
          limits={RESUME_LIMITS}
          prompt="Choose a PDF or drag it here"
          submitLabel={resume ? "Replace resume" : "Upload resume"}
        />
      </Card>

      <ConfirmModal
        open={deleteOpen}
        title="Delete resume?"
        message="The PDF is permanently removed and the Resume button disappears from the website. You can upload a new one at any time."
        confirmLabel="Delete resume"
        danger
        busy={mutations.pending === "remove"}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

function ResumeStatusBadge({ resume }: { resume: ManagedFileSummary | null }) {
  if (!resume) {
    return (
      <Badge tone="neutral" dot>
        Not uploaded
      </Badge>
    );
  }
  return resume.published ? (
    <Badge tone="success" dot>
      Published
    </Badge>
  ) : (
    <Badge tone="warning" dot>
      Unpublished
    </Badge>
  );
}
