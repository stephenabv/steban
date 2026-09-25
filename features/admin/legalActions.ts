"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/server/auth/session";
import { isLegalDocumentKind, type LegalDocumentVersion } from "@/server/domain/entities";
import { getLegalDocumentService, LegalDocumentError } from "@/server/services";
import type { Result } from "@/server/domain/types";
import { legalDraftSchema, legalVersionIdSchema, type LegalDraftFormInput } from "@/server/security/contentSchemas";
import { LEGAL_DOCUMENTS } from "@/config/legal";
import type { ContentActionResult } from "./contentActions";

export interface LegalActionResult {
  ok: boolean;
  error?: string;
  /** Id of the version created or changed. */
  id?: string;
}

const UNAUTHORIZED = { ok: false, error: "Your session has expired. Please sign in again." } as const;
const NOT_FOUND = { ok: false, error: "This version no longer exists." } as const;
const FAILED = { ok: false, error: "Something went wrong. Please try again." } as const;

async function requireAdmin(): Promise<boolean> {
  // Server Functions are public HTTP endpoints — never rely on the proxy alone.
  const session = await getSession();
  return session.isAdmin === true;
}

/** Maps a service result to an action result; only rule violations reach the UI verbatim. */
function settle(result: Result<LegalDocumentVersion>, label: string): LegalActionResult {
  if (result.ok) {
    revalidatePath(LEGAL_DOCUMENTS[result.value.kind].path);
    return { ok: true, id: result.value.id };
  }
  if (result.error instanceof LegalDocumentError) return { ok: false, error: result.error.message };
  console.error(`[legal] ${label} failed:`, result.error);
  return FAILED;
}

export async function createLegalDraftAction(kind: string, fromVersionId?: string): Promise<LegalActionResult> {
  if (!(await requireAdmin())) return UNAUTHORIZED;
  if (!isLegalDocumentKind(kind)) return { ok: false, error: "Unknown document." };
  if (fromVersionId !== undefined && !legalVersionIdSchema.safeParse(fromVersionId).success) return NOT_FOUND;

  const result = await getLegalDocumentService().createDraft(
    kind,
    fromVersionId ? { from: "version", versionId: fromVersionId } : { from: "default" }
  );
  return settle(result, "create draft");
}

export async function saveLegalDraftAction(id: string, input: LegalDraftFormInput): Promise<ContentActionResult> {
  if (!(await requireAdmin())) return UNAUTHORIZED;
  if (!legalVersionIdSchema.safeParse(id).success) return NOT_FOUND;

  const parsed = legalDraftSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  const result = await getLegalDocumentService().saveDraft(id, parsed.data);
  if (!result.ok) {
    if (result.error instanceof LegalDocumentError) return { ok: false, error: result.error.message };
    console.error("[legal] save draft failed:", result.error);
    return { ok: false, error: "Couldn't save. Please try again." };
  }
  return { ok: true, savedAt: result.value.updatedAt.toISOString() };
}

export async function publishLegalVersionAction(id: string): Promise<LegalActionResult> {
  if (!(await requireAdmin())) return UNAUTHORIZED;
  if (!legalVersionIdSchema.safeParse(id).success) return NOT_FOUND;
  return settle(await getLegalDocumentService().publish(id), "publish");
}

export async function unpublishLegalVersionAction(id: string): Promise<LegalActionResult> {
  if (!(await requireAdmin())) return UNAUTHORIZED;
  if (!legalVersionIdSchema.safeParse(id).success) return NOT_FOUND;
  return settle(await getLegalDocumentService().unpublish(id), "unpublish");
}

export async function deleteLegalVersionAction(id: string): Promise<LegalActionResult> {
  if (!(await requireAdmin())) return UNAUTHORIZED;
  if (!legalVersionIdSchema.safeParse(id).success) return NOT_FOUND;
  return settle(await getLegalDocumentService().delete(id), "delete");
}
