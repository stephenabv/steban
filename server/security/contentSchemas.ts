import { randomUUID } from "crypto";
import { z } from "zod";
import { SEO_PAGE_KEYS } from "@/server/domain/entities";
import { LEGAL_LIMITS } from "@/config/legal";

/*
 * Validation for admin-editable site content. Every URL that can end up in an
 * href is restricted to http(s) (or a site-relative path where noted), so no
 * `javascript:`/`data:` link can be stored.
 */

const text = (max: number) => z.string().trim().max(max, `Must be at most ${max} characters.`);
const requiredText = (label: string, max: number) =>
  text(max).min(1, `${label} is required.`);

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Empty (field unused) or an absolute http(s) URL. */
const optionalHttpUrl = text(2048).refine((v) => v === "" || isHttpUrl(v), "Enter a full URL starting with https://");

/** A site path like "/privacy" (no protocol-relative "//host") or an absolute http(s) URL. */
const linkTarget = (label: string) =>
  requiredText(label, 2048).refine(
    (v) => (v.startsWith("/") && !v.startsWith("//")) || isHttpUrl(v),
    "Use a site path such as /privacy or a full https:// URL."
  );

/** Client-generated ids are kept when well-formed, otherwise replaced. */
const itemId = z
  .string()
  .optional()
  .transform((v) => (v && /^[a-zA-Z0-9-]{8,64}$/.test(v) ? v : randomUUID()));

/** "YYYY-MM" (month inputs) → Date at the first of that month, UTC. */
const monthDate = (label: string) =>
  z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, `${label} must be a month (YYYY-MM).`)
    .transform((v) => new Date(`${v}-01T00:00:00.000Z`));
const optionalMonthDate = (label: string) =>
  z
    .union([z.literal(""), monthDate(label)])
    .optional()
    .transform((v) => (v instanceof Date ? v : undefined));

const year = z.coerce.number().int().min(1950, "Year looks too early.").max(2100, "Year looks too late.");
const optionalYear = z
  .union([z.literal(""), year])
  .optional()
  .transform((v) => (typeof v === "number" ? v : undefined));

const stringList = (itemMax: number, listMax: number) =>
  z.array(text(itemMax)).max(listMax).transform((list) => list.filter(Boolean));

// ─── Hero ─────────────────────────────────────────────────────────────────────
export const heroSchema = z.object({
  name: requiredText("Display name", 100),
  title: requiredText("Professional title", 120),
  introduction: text(600),
  photoAlt: text(200),
});

// ─── About ────────────────────────────────────────────────────────────────────
export const aboutSchema = z.object({
  biography: text(10000),
  skills: z
    .array(
      z.object({
        id: itemId,
        name: requiredText("Skill name", 60),
        category: requiredText("Skill category", 60),
        proficiencyLevel: z.coerce.number().int().min(1).max(5).default(3) as z.ZodType<1 | 2 | 3 | 4 | 5>,
      })
    )
    .max(150)
    .transform((skills) => skills.map((s, order) => ({ ...s, order }))),
  experience: z
    .array(
      z
        .object({
          id: itemId,
          company: requiredText("Company", 120),
          role: requiredText("Role", 120),
          startDate: monthDate("Start date"),
          endDate: optionalMonthDate("End date"),
          current: z.boolean().default(false),
          description: text(3000),
          technologies: stringList(50, 30),
        })
        .refine((e) => e.current || !e.endDate || e.endDate >= e.startDate, {
          message: "End date can't be before the start date.",
          path: ["endDate"],
        })
        .transform((e) => (e.current ? { ...e, endDate: undefined } : e))
    )
    .max(50),
  education: z
    .array(
      z
        .object({
          id: itemId,
          institution: requiredText("Institution", 150),
          degree: requiredText("Degree", 120),
          field: requiredText("Field of study", 120),
          startYear: year,
          endYear: optionalYear,
          description: text(2000).optional().transform((v) => v || undefined),
        })
        .refine((e) => !e.endYear || e.endYear >= e.startYear, {
          message: "End year can't be before the start year.",
          path: ["endYear"],
        })
    )
    .max(30),
  certifications: z
    .array(
      z.object({
        id: itemId,
        name: requiredText("Certification name", 150),
        issuer: requiredText("Issuer", 120),
        issuedAt: monthDate("Issue date"),
        expiresAt: optionalMonthDate("Expiry date"),
        credentialUrl: optionalHttpUrl.optional().transform((v) => v || undefined),
      })
    )
    .max(50),
  awards: z
    .array(
      z.object({
        id: itemId,
        title: requiredText("Award title", 150),
        issuer: requiredText("Issuer", 120),
        year,
        description: text(1000).optional().transform((v) => v || undefined),
      })
    )
    .max(50),
});

// ─── SEO ──────────────────────────────────────────────────────────────────────
export const seoSchema = z.object({
  pageKey: z.enum(SEO_PAGE_KEYS),
  title: text(70),
  description: text(200),
  keywords: stringList(50, 20),
  ogImageUrl: optionalHttpUrl.transform((v) => v || undefined),
  noIndex: z.boolean().default(false),
});

// ─── Contact & social ────────────────────────────────────────────────────────
export const contactEmailSchema = z.object({
  email: z.union([z.literal(""), z.string().trim().toLowerCase().email("Enter a valid email address.").max(254)]),
});

export const socialLinksSchema = z.object({
  githubUrl: optionalHttpUrl,
  linkedinUrl: optionalHttpUrl,
  facebookUrl: optionalHttpUrl,
});

// ─── Footer ───────────────────────────────────────────────────────────────────
export const footerSchema = z.object({
  privacyUrl: linkTarget("Privacy policy link"),
  termsUrl: linkTarget("Terms & conditions link"),
});

export type HeroFormInput = z.input<typeof heroSchema>;
export type AboutFormInput = z.input<typeof aboutSchema>;
export type SeoFormInput = z.input<typeof seoSchema>;
export type ContactEmailFormInput = z.input<typeof contactEmailSchema>;
export type SocialLinksFormInput = z.input<typeof socialLinksSchema>;
export type FooterFormInput = z.input<typeof footerSchema>;

// ─── Legal documents ──────────────────────────────────────────────────────────
export const legalDraftSchema = z.object({
  title: requiredText("Title", LEGAL_LIMITS.titleMax),
  body: requiredText("Content", LEGAL_LIMITS.bodyMax),
  changeNote: text(LEGAL_LIMITS.changeNoteMax),
});
export type LegalDraftFormInput = z.input<typeof legalDraftSchema>;

/** Version ids are server-generated UUIDs; anything else is rejected before storage. */
export const legalVersionIdSchema = z.uuid();
