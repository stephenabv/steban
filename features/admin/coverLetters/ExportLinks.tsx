import { EXPORT_FORMATS } from "@/server/domain/coverLetter";
import type { ExportFormat } from "@/server/domain/coverLetter";
import { Button, buttonClassName } from "@/components/ui/Button";
import { Icon } from "@/components/icons/Icon";

const FORMAT_LABELS: Record<ExportFormat, string> = { pdf: "PDF", docx: "DOCX", txt: "Text" };

/** Admin-only download route; it re-checks the session and ownership itself. */
export function exportHref(id: string, format: ExportFormat): string {
  return `/api/admin/cover-letters/${encodeURIComponent(id)}/export?format=${format}`;
}

/**
 * Downloads always reflect the saved letter, so they are disabled while the
 * editor holds unsaved changes. Plain anchors: a download is not a navigation.
 */
export function ExportLinks({ id, disabled }: { id: string; disabled: boolean }) {
  return EXPORT_FORMATS.map((format) =>
    disabled ? (
      <Button
        key={format}
        variant="secondary"
        size="sm"
        icon="download"
        disabled
        title="Save your edits first"
      >
        {FORMAT_LABELS[format]}
      </Button>
    ) : (
      <a
        key={format}
        href={exportHref(id, format)}
        download
        className={buttonClassName({ variant: "secondary", size: "sm" })}
      >
        <Icon name="download" size={14} />
        {FORMAT_LABELS[format]}
      </a>
    )
  );
}
