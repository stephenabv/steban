import type { ButtonVariant } from "@/components/ui/Button";
import type { IconName } from "@/components/icons/Icon";
import { LEGAL_DOCUMENTS } from "@/config/legal";
import { LegalVersionLifecycle } from "@/server/domain/legal/LegalVersionLifecycle";
import {
  createLegalDraftAction,
  deleteLegalVersionAction,
  publishLegalVersionAction,
  unpublishLegalVersionAction,
  type LegalActionResult,
} from "../legalActions";
import type { LegalVersionSummary } from "./LegalVersionDto";

/** What the commands need to know about where they run. */
export interface LegalCommandContext {
  basePath: string;
  /** The version currently live for this document, if any. */
  live: LegalVersionSummary | null;
  /** True on the version's own editor page (deleting it must leave the page). */
  onVersionPage: boolean;
}

export interface LegalCommandConfirmation {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
}

/** A user-invocable operation on a version (Command pattern). */
export interface LegalCommand {
  id: "publish" | "unpublish" | "duplicate" | "delete";
  label: string;
  icon: IconName;
  variant: ButtonVariant;
  isAvailable(version: LegalVersionSummary): boolean;
  confirmation?(version: LegalVersionSummary, ctx: LegalCommandContext): LegalCommandConfirmation;
  execute(version: LegalVersionSummary): Promise<LegalActionResult>;
  successMessage(version: LegalVersionSummary): string;
  /** Where to go after success; the current page is refreshed when omitted. */
  destination?(result: LegalActionResult, version: LegalVersionSummary, ctx: LegalCommandContext): string | null;
}

const docLabel = (v: LegalVersionSummary) => LEGAL_DOCUMENTS[v.kind].label;
const listHref = (v: LegalVersionSummary, ctx: LegalCommandContext) => `${ctx.basePath}/legal?doc=${v.kind}`;

export const publishCommand: LegalCommand = {
  id: "publish",
  label: "Publish",
  icon: "globe",
  variant: "primary",
  isAvailable: (v) => LegalVersionLifecycle.can(v.status, "publish"),
  confirmation: (v, ctx) => ({
    title: `Publish version ${v.versionNumber}?`,
    message: ctx.live
      ? `It replaces version ${ctx.live.versionNumber} on ${LEGAL_DOCUMENTS[v.kind].path} immediately. Version ${ctx.live.versionNumber} is kept as unpublished.`
      : `It appears on ${LEGAL_DOCUMENTS[v.kind].path} immediately, replacing the built-in wording.`,
    confirmLabel: "Publish",
  }),
  execute: (v) => publishLegalVersionAction(v.id),
  successMessage: (v) => `Version ${v.versionNumber} of the ${docLabel(v)} is now live.`,
};

export const unpublishCommand: LegalCommand = {
  id: "unpublish",
  label: "Unpublish",
  icon: "eye-off",
  variant: "secondary",
  isAvailable: (v) => LegalVersionLifecycle.can(v.status, "unpublish"),
  confirmation: (v) => ({
    title: `Unpublish version ${v.versionNumber}?`,
    message: `${LEGAL_DOCUMENTS[v.kind].path} will show the built-in ${docLabel(v)} until you publish another version.`,
    confirmLabel: "Unpublish",
    danger: true,
  }),
  execute: (v) => unpublishLegalVersionAction(v.id),
  successMessage: (v) => `Version ${v.versionNumber} unpublished — the site shows the built-in wording.`,
};

export const duplicateCommand: LegalCommand = {
  id: "duplicate",
  label: "New draft from this",
  icon: "copy",
  variant: "ghost",
  isAvailable: () => true,
  execute: (v) => createLegalDraftAction(v.kind, v.id),
  successMessage: (v) => `New draft created from version ${v.versionNumber}.`,
  destination: (result, _v, ctx) => (result.id ? `${ctx.basePath}/legal/${result.id}` : null),
};

export const deleteCommand: LegalCommand = {
  id: "delete",
  label: "Delete",
  icon: "trash",
  variant: "danger",
  isAvailable: (v) => LegalVersionLifecycle.can(v.status, "delete"),
  confirmation: (v) => ({
    title: `Delete version ${v.versionNumber}?`,
    message: `This permanently removes this ${v.status} version. It can't be undone.`,
    confirmLabel: "Delete version",
    danger: true,
  }),
  execute: (v) => deleteLegalVersionAction(v.id),
  successMessage: (v) => `Version ${v.versionNumber} deleted.`,
  destination: (_r, v, ctx) => (ctx.onVersionPage ? listHref(v, ctx) : null),
};

export const LEGAL_COMMANDS: readonly LegalCommand[] = [publishCommand, unpublishCommand, duplicateCommand, deleteCommand];
