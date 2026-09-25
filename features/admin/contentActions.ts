"use server";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getSession } from "@/server/auth/session";
import {
  getAboutService,
  getContactService,
  getFooterService,
  getHeroService,
  getSeoService,
} from "@/server/services";
import {
  aboutSchema,
  contactEmailSchema,
  footerSchema,
  heroSchema,
  seoSchema,
  socialLinksSchema,
} from "@/server/security/contentSchemas";
import type {
  AboutFormInput,
  ContactEmailFormInput,
  FooterFormInput,
  HeroFormInput,
  SeoFormInput,
  SocialLinksFormInput,
} from "@/server/security/contentSchemas";
import type { ContactInfoContent } from "@/server/domain/entities";
import { siteConfig } from "@/config/site";
import { socialLinks } from "@/config/social";

export interface ContentActionResult {
  ok: boolean;
  error?: string;
  /** Dotted field path → message, e.g. "experience.2.company". */
  fieldErrors?: Record<string, string>;
  /** ISO timestamp of the saved record. */
  savedAt?: string;
}

async function requireAdmin(): Promise<boolean> {
  // Server Functions are public HTTP endpoints — never rely on the proxy alone.
  const session = await getSession();
  return session.isAdmin === true;
}

function validationFailure(error: z.ZodError): ContentActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
}

const UNAUTHORIZED: ContentActionResult = { ok: false, error: "Your session has expired. Please sign in again." };
const SAVE_FAILED: ContentActionResult = { ok: false, error: "Couldn't save. Please try again." };

export async function saveHeroAction(input: HeroFormInput): Promise<ContentActionResult> {
  if (!(await requireAdmin())) return UNAUTHORIZED;
  const parsed = heroSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const result = await getHeroService().save(parsed.data);
  if (!result.ok) return SAVE_FAILED;
  revalidatePath("/");
  return { ok: true, savedAt: result.value.updatedAt.toISOString() };
}

export async function saveAboutAction(input: AboutFormInput): Promise<ContentActionResult> {
  if (!(await requireAdmin())) return UNAUTHORIZED;
  const parsed = aboutSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const result = await getAboutService().save(parsed.data);
  if (!result.ok) return SAVE_FAILED;
  revalidatePath("/about");
  return { ok: true, savedAt: result.value.updatedAt.toISOString() };
}

const SEO_PATHS = { home: "/", projects: "/projects", about: "/about", contact: "/contact" } as const;

export async function saveSeoAction(input: SeoFormInput): Promise<ContentActionResult> {
  if (!(await requireAdmin())) return UNAUTHORIZED;
  const parsed = seoSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const { pageKey, ...content } = parsed.data;
  const result = await getSeoService().upsert(pageKey, content);
  if (!result.ok) return SAVE_FAILED;
  revalidatePath(SEO_PATHS[pageKey]);
  return { ok: true, savedAt: result.value.updatedAt.toISOString() };
}

/**
 * Email and social profiles share one contact_info row. Each editor changes
 * only its own fields; on the first save the others are seeded from the
 * current config values so nothing disappears from the site.
 */
async function saveContactFields(patch: Partial<ContactInfoContent>): Promise<ContentActionResult> {
  const service = getContactService();
  const current = await service.getContactInfo();
  if (!current.ok) return SAVE_FAILED;

  const saved = current.value;
  const existing: ContactInfoContent = saved
    ? { email: saved.email, githubUrl: saved.githubUrl, linkedinUrl: saved.linkedinUrl, facebookUrl: saved.facebookUrl }
    : {
        email: siteConfig.author.email,
        githubUrl: socialLinks.github.url,
        linkedinUrl: socialLinks.linkedin.url,
        facebookUrl: socialLinks.facebook.url,
      };
  const result = await service.saveContactInfo({ ...existing, ...patch });
  if (!result.ok) return SAVE_FAILED;

  // Footer, contact page and home JSON-LD all read these values.
  revalidatePath("/", "layout");
  return { ok: true, savedAt: result.value.updatedAt.toISOString() };
}

export async function saveContactEmailAction(input: ContactEmailFormInput): Promise<ContentActionResult> {
  if (!(await requireAdmin())) return UNAUTHORIZED;
  const parsed = contactEmailSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return saveContactFields(parsed.data);
}

export async function saveSocialLinksAction(input: SocialLinksFormInput): Promise<ContentActionResult> {
  if (!(await requireAdmin())) return UNAUTHORIZED;
  const parsed = socialLinksSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return saveContactFields(parsed.data);
}

export async function saveFooterAction(input: FooterFormInput): Promise<ContentActionResult> {
  if (!(await requireAdmin())) return UNAUTHORIZED;
  const parsed = footerSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);

  const result = await getFooterService().save(parsed.data);
  if (!result.ok) return SAVE_FAILED;
  revalidatePath("/", "layout");
  return { ok: true, savedAt: result.value.updatedAt.toISOString() };
}
