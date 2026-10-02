export const REQUIREMENT_KINDS = ["skill", "tool", "responsibility", "softSkill"] as const;
export type RequirementKind = (typeof REQUIREMENT_KINDS)[number];

/** One thing the job description asks for. */
export interface Requirement {
  kind: RequirementKind;
  /** Canonical name for skills/tools/soft skills; the bullet text for responsibilities. */
  term: string;
  /** How strongly the posting stresses it (occurrence count, at least 1). */
  weight: number;
}

export const EVIDENCE_SOURCES = ["skill", "experience", "project"] as const;
export type EvidenceSource = (typeof EVIDENCE_SOURCES)[number];

/** A part of the profile that backs a requirement. */
export interface Evidence {
  source: EvidenceSource;
  /** e.g. "Senior Engineer at Acme" or a project title. */
  label: string;
}

export interface RequirementMatch {
  requirement: Requirement;
  /** Strongest first. */
  evidence: Evidence[];
  /** 0–1. */
  confidence: number;
}

/** An experience or project ranked by how much of the posting it covers. */
export interface RankedHighlight {
  source: Exclude<EvidenceSource, "skill">;
  /** Index into `profile.experiences` or `profile.projects`. */
  index: number;
  label: string;
  /** Canonical technologies from the posting this item demonstrates, most important first. */
  matchedTechnologies: string[];
  score: number;
}

export interface MatchReport {
  /** Highest confidence × weight first. */
  matches: RequirementMatch[];
  /** Requirements with no truthful evidence: shown to the admin as "Gaps not mentioned". */
  unmatched: Requirement[];
  /** Best supporting roles and projects, strongest first. */
  highlights: RankedHighlight[];
}
