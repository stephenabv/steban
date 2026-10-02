import type {
  CoverLetterSections,
  CoverLetterStatus,
  GeneratorStrategy,
  JobApplicationContent,
  LetterLength,
  LetterTone,
  RequirementKind,
  WorkArrangement,
} from "@/server/domain/coverLetter";
import type {
  CoverLetterRecord,
  CoverLetterSummary,
} from "@/server/repositories/coverLetter/CoverLetterRepository";
import type { JobApplicationFormInput } from "@/server/security/coverLetterSchemas";

/*
 * Serialisable shapes passed from Server Components and actions to the
 * cover letter UI. The job description is deliberately left out of every
 * view model: the UI never needs it after generation.
 */

export interface CoverLetterListItem {
  id: string;
  status: CoverLetterStatus;
  companyName: string;
  positionTitle: string;
  letterDate: string;
  updatedAt: string;
}

export interface RequirementMatchView {
  kind: RequirementKind;
  term: string;
  evidence: string[];
  /** 0–100. */
  confidence: number;
}

export interface RequirementGapView {
  kind: RequirementKind;
  term: string;
}

export interface CoverLetterView {
  id: string;
  status: CoverLetterStatus;
  generator: GeneratorStrategy;
  updatedAt: string;
  sections: CoverLetterSections;
  application: {
    companyName: string;
    positionTitle: string;
    workArrangement: WorkArrangement;
    tone: LetterTone;
    length: LetterLength;
  };
  matches: RequirementMatchView[];
  gaps: RequirementGapView[];
}

export function toListItem(summary: CoverLetterSummary): CoverLetterListItem {
  return {
    id: summary.id,
    status: summary.status,
    companyName: summary.companyName,
    positionTitle: summary.positionTitle,
    letterDate: summary.letterDate,
    updatedAt: summary.updatedAt.toISOString(),
  };
}

export function toCoverLetterView({ letter, application }: CoverLetterRecord): CoverLetterView {
  return {
    id: letter.id,
    status: letter.status,
    generator: letter.generator,
    updatedAt: letter.updatedAt.toISOString(),
    sections: letter.sections,
    application: {
      companyName: application.companyName,
      positionTitle: application.positionTitle,
      workArrangement: application.workArrangement,
      tone: application.tone,
      length: application.length,
    },
    matches: letter.matchReport.matches.map(({ requirement, evidence, confidence }) => ({
      kind: requirement.kind,
      term: requirement.term,
      evidence: evidence.map((item) => item.label),
      confidence: Math.round(confidence * 100),
    })),
    gaps: letter.matchReport.unmatched.map(({ kind, term }) => ({ kind, term })),
  };
}

/** Form values (all strings) for a new application, optionally pre-filled. */
export function toFormValues(
  application: Partial<JobApplicationContent> & Pick<JobApplicationContent, "letterDate">
): JobApplicationFormInput {
  return {
    companyName: application.companyName ?? "",
    companyLocation: application.companyLocation ?? "",
    hiringManager: application.hiringManager ?? "",
    positionTitle: application.positionTitle ?? "",
    workArrangement: application.workArrangement ?? { mode: "remote", schedule: "" },
    jobDescription: application.jobDescription ?? "",
    industryContext: application.industryContext ?? "",
    postingUrl: application.postingUrl ?? "",
    letterDate: application.letterDate,
    tone: application.tone ?? "professional",
    length: application.length ?? "standard",
  };
}
