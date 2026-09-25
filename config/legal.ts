import type { LegalDocumentKind } from "@/server/domain/entities";

export interface LegalDocumentDefinition {
  kind: LegalDocumentKind;
  /** Page title shown publicly and in the admin. */
  label: string;
  /** Public route. */
  path: string;
  /** One-line description for metadata and the admin. */
  description: string;
}

export const LEGAL_DOCUMENTS: Record<LegalDocumentKind, LegalDocumentDefinition> = {
  privacy: {
    kind: "privacy",
    label: "Privacy Policy",
    path: "/privacy",
    description: "What information this site collects, why, and your choices.",
  },
  terms: {
    kind: "terms",
    label: "Terms & Conditions",
    path: "/terms",
    description: "Terms of use, including ownership of the projects shown in the portfolio.",
  },
};

/** Limits shared by the server schema and the admin editor. */
export const LEGAL_LIMITS = {
  titleMax: 120,
  bodyMax: 50_000,
  changeNoteMax: 300,
} as const;
