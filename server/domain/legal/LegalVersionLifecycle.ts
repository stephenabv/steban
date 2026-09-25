import type { LegalVersionStatus } from "@/server/domain/entities";

export type LegalVersionAction = "edit" | "publish" | "unpublish" | "delete";

/**
 * Single source of truth for what may happen to a version in each state.
 * Published wording is immutable so the record of what visitors agreed to is
 * never rewritten; changes go through a new draft.
 */
const ALLOWED: Record<LegalVersionStatus, ReadonlySet<LegalVersionAction>> = {
  draft: new Set(["edit", "publish", "delete"]),
  published: new Set(["unpublish"]),
  unpublished: new Set(["publish", "delete"]),
};

const REASONS: Record<LegalVersionAction, string> = {
  edit: "Only drafts can be edited. Create a new draft from this version instead.",
  publish: "This version is already published.",
  unpublish: "Only the published version can be unpublished.",
  delete: "The published version can't be deleted. Unpublish it first.",
};

export class LegalVersionLifecycle {
  static can(status: LegalVersionStatus, action: LegalVersionAction): boolean {
    return ALLOWED[status].has(action);
  }

  static allowedActions(status: LegalVersionStatus): LegalVersionAction[] {
    return [...ALLOWED[status]];
  }

  /** Statuses in which `action` is allowed — used for race-safe conditional writes. */
  static statusesAllowing(action: LegalVersionAction): LegalVersionStatus[] {
    return (Object.keys(ALLOWED) as LegalVersionStatus[]).filter((status) => ALLOWED[status].has(action));
  }

  /** User-facing reason an action isn't allowed. */
  static reason(action: LegalVersionAction): string {
    return REASONS[action];
  }
}
