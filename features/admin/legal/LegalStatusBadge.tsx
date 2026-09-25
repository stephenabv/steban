import type { LegalVersionStatus } from "@/server/domain/entities";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

const APPEARANCE: Record<LegalVersionStatus, { tone: BadgeTone; label: string }> = {
  draft: { tone: "warning", label: "Draft" },
  published: { tone: "success", label: "Published" },
  unpublished: { tone: "neutral", label: "Unpublished" },
};

export function LegalStatusBadge({ status }: { status: LegalVersionStatus }) {
  const { tone, label } = APPEARANCE[status];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}
