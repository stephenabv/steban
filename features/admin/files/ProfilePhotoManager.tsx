"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { PROFILE_PHOTO_LIMITS } from "@/config/uploads";
import { formatBytes } from "@/lib/formatBytes";
import type { ManagedFileSummary } from "@/lib/files/ManagedFileSummary";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import { FileDropzone } from "./FileDropzone";
import { useFileUpload } from "./useFileUpload";
import { uploadedFormatter } from "./formatters";
import styles from "./FileManager.module.less";

const ENDPOINT = "/api/admin/profile-photo";

const FORMAT_LABELS: Record<string, string> = {
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WebP",
};

interface Props {
  photo: ManagedFileSummary | null;
  /** Versioned public URL of the active photo (null when none is uploaded). */
  src: string | null;
  /** Initials shown on the site while no photo is uploaded. */
  initials: string;
}

/** Upload, preview, replace and remove the hero profile photo. */
export function ProfilePhotoManager({ photo, src, initials }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const onUploaded = useCallback(() => {
    toast.success(photo ? "Photo replaced — the home page now shows the new one." : "Photo uploaded and published.");
    router.refresh();
  }, [photo, router, toast]);

  const upload = useFileUpload({
    endpoint: ENDPOINT,
    limits: PROFILE_PHOTO_LIMITS,
    label: "photo",
    hasCurrent: photo !== null,
    onUploaded,
  });

  async function remove() {
    setRemoving(true);
    try {
      const res = await fetch(ENDPOINT, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        toast.error(
          res.status === 401 ? "Your session has expired. Sign in again, then retry." : (data.error ?? `Couldn't remove the photo (${res.status}).`)
        );
        return;
      }
      setConfirmOpen(false);
      toast.success("Photo removed — the home page shows your initials.");
      router.refresh();
    } catch {
      toast.error("Network error — the photo wasn't removed.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <Card padding="lg">
      <CardHeader
        title="Profile photo"
        description={`Shown beside your introduction on the home page. ${PROFILE_PHOTO_LIMITS.typeLabel}, up to ${formatBytes(
          PROFILE_PHOTO_LIMITS.maxBytes
        )}; a portrait (4:5) crop works best.`}
        actions={
          photo ? (
            <Badge tone="success" dot>
              Active
            </Badge>
          ) : (
            <Badge tone="neutral" dot>
              Using initials
            </Badge>
          )
        }
      />

      <div className={styles.current}>
        <div className={styles.photoThumb}>
          {src ? (
            // A plain <img>: the admin preview needs the original bytes, not an optimized variant.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt="Current upload" />
          ) : (
            <span aria-label="No photo — initials shown" role="img">
              {initials}
            </span>
          )}
        </div>
        <div className={styles.fileMeta}>
          {photo ? (
            <>
              <p className={styles.fileName}>{photo.fileName}</p>
              <p className={styles.fileDetails}>
                {FORMAT_LABELS[photo.contentType] ?? "Image"} · {formatBytes(photo.sizeBytes)} · Uploaded{" "}
                <time dateTime={photo.uploadedAt}>{uploadedFormatter.format(new Date(photo.uploadedAt))}</time>
              </p>
            </>
          ) : (
            <>
              <p className={styles.fileName}>No photo uploaded</p>
              <p className={styles.fileDetails}>Your initials are shown until you upload one.</p>
            </>
          )}
        </div>
        {photo && (
          <div className={styles.fileActions}>
            <Button variant="danger" icon="trash" onClick={() => setConfirmOpen(true)}>
              Remove
            </Button>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <FileDropzone
          upload={upload}
          limits={PROFILE_PHOTO_LIMITS}
          prompt={photo ? "Choose a new photo or drag it here" : "Choose a photo or drag it here"}
          submitLabel={photo ? "Replace photo" : "Upload photo"}
        />
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Remove profile photo?"
        message="The home page will show your initials instead. You can upload a new photo at any time."
        confirmLabel="Remove photo"
        danger
        busy={removing}
        onConfirm={() => void remove()}
        onCancel={() => setConfirmOpen(false)}
      />
    </Card>
  );
}
