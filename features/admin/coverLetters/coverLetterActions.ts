"use server";

import "server-only";
import type { z } from "zod";
import type { Result } from "@/server/domain/types";
import { CoverLetterError } from "@/server/domain/coverLetter";
import { requireAdmin } from "@/server/security/adminGuard";
import type { AdminPrincipal } from "@/server/security/adminGuard";
import { rateLimit, rateLimitPolicies } from "@/server/security/rateLimit";
import {
  coverLetterEditSchema,
  coverLetterIdSchema,
  fieldErrorsOf,
  generateCoverLetterSchema,
  regenerateCoverLetterSchema,
} from "@/server/security/coverLetterSchemas";
import type {
  CoverLetterEditInput,
  GenerateCoverLetterInput,
  RegenerateCoverLetterInput,
} from "@/server/security/coverLetterSchemas";
import { getCoverLetterService } from "@/server/services/coverLetter/coverLetterService.instance";
import type { CoverLetterRecord } from "@/server/repositories/coverLetter/CoverLetterRepository";
import { toCoverLetterView } from "./CoverLetterDto";
import type { CoverLetterView } from "./CoverLetterDto";

export interface CoverLetterActionResult<T = undefined> {
  ok: boolean;
  error?: string;
  /** Dotted field path → message, e.g. "application.companyName". */
  fieldErrors?: Record<string, string>;
  data?: T;
}

type Failure = CoverLetterActionResult<never>;

const UNAUTHORIZED: Failure = {
  ok: false,
  error: "Your session has expired. Please sign in again.",
};
const NOT_FOUND: Failure = { ok: false, error: "This cover letter no longer exists." };
const FAILED: Failure = { ok: false, error: "Something went wrong. Please try again." };

function validationFailure(error: z.ZodError): Failure {
  return {
    ok: false,
    error: "Please fix the highlighted fields.",
    fieldErrors: fieldErrorsOf(error),
  };
}

/** Generation is rate limited per admin, not per IP. */
function rateLimited(admin: AdminPrincipal): Failure | null {
  const limit = rateLimit(`cover-letter:${admin.ownerId}`, rateLimitPolicies.coverLetterGeneration);
  if (limit.allowed) return null;
  const minutes = Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 60_000));
  return { ok: false, error: `Generation limit reached. Try again in ${minutes} min.` };
}

/**
 * Maps a service result to an action result. Only CoverLetterError messages
 * reach the browser; anything else is logged by type, never with letter or
 * job-description content.
 */
function settle<T, U>(
  result: Result<T>,
  label: string,
  map: (value: T) => U
): CoverLetterActionResult<U> {
  if (result.ok) return { ok: true, data: map(result.value) };
  if (result.error instanceof CoverLetterError) return { ok: false, error: result.error.message };
  console.error(`[cover-letter] ${label} failed:`, result.error.name);
  return FAILED;
}

/** Auth first, then id validation, for every action that targets one letter. */
async function authorize(id: string): Promise<AdminPrincipal | Failure> {
  const admin = await requireAdmin();
  if (!admin) return UNAUTHORIZED;
  if (!coverLetterIdSchema.safeParse(id).success) return NOT_FOUND;
  return admin;
}

const isFailure = (value: AdminPrincipal | Failure): value is Failure => "ok" in value;

const view = (record: CoverLetterRecord): CoverLetterView => toCoverLetterView(record);

export async function generateCoverLetterAction(
  input: GenerateCoverLetterInput
): Promise<CoverLetterActionResult<{ id: string; notices: string[] }>> {
  const admin = await requireAdmin();
  if (!admin) return UNAUTHORIZED;
  const parsed = generateCoverLetterSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const limited = rateLimited(admin);
  if (limited) return limited;

  const { application, strategy } = parsed.data;
  const result = await getCoverLetterService().generate(admin.ownerId, application, strategy);
  return settle(result, "generate", (outcome) => ({
    id: outcome.record.letter.id,
    notices: outcome.notices,
  }));
}

export async function regenerateCoverLetterAction(
  id: string,
  input: RegenerateCoverLetterInput
): Promise<CoverLetterActionResult<{ letter: CoverLetterView; notices: string[] }>> {
  const admin = await authorize(id);
  if (isFailure(admin)) return admin;
  const parsed = regenerateCoverLetterSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const limited = rateLimited(admin);
  if (limited) return limited;

  const result = await getCoverLetterService().regenerate(admin.ownerId, id, parsed.data);
  return settle(result, "regenerate", (outcome) => ({
    letter: view(outcome.record),
    notices: outcome.notices,
  }));
}

export async function saveCoverLetterAction(
  id: string,
  input: CoverLetterEditInput
): Promise<CoverLetterActionResult<{ letter: CoverLetterView; warnings: string[] }>> {
  const admin = await authorize(id);
  if (isFailure(admin)) return admin;
  const parsed = coverLetterEditSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const result = await getCoverLetterService().saveEdit(admin.ownerId, id, parsed.data);
  return settle(result, "save", (outcome) => ({
    letter: view(outcome.record),
    warnings: outcome.warnings,
  }));
}

export async function finalizeCoverLetterAction(
  id: string
): Promise<CoverLetterActionResult<CoverLetterView>> {
  const admin = await authorize(id);
  if (isFailure(admin)) return admin;
  return settle(await getCoverLetterService().finalize(admin.ownerId, id), "finalize", view);
}

export async function reopenCoverLetterAction(
  id: string
): Promise<CoverLetterActionResult<CoverLetterView>> {
  const admin = await authorize(id);
  if (isFailure(admin)) return admin;
  return settle(await getCoverLetterService().reopen(admin.ownerId, id), "reopen", view);
}

export async function deleteCoverLetterAction(id: string): Promise<CoverLetterActionResult> {
  const admin = await authorize(id);
  if (isFailure(admin)) return admin;
  return settle(await getCoverLetterService().delete(admin.ownerId, id), "delete", () => undefined);
}
