import type {
  CoverLetterStatus,
  GeneratorStrategy,
  LetterLength,
  LetterTone,
  RequirementKind,
  WorkMode,
} from "@/server/domain/coverLetter";
import type { BadgeTone } from "@/components/ui/Badge";

/** Display labels for the cover letter enums, shared by every cover letter screen. */

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  onsite: "Onsite",
  hybrid: "Hybrid",
  remote: "Remote",
};

export const TONE_LABELS: Record<LetterTone, string> = {
  professional: "Professional",
  warm: "Warm",
};

export const LENGTH_LABELS: Record<LetterLength, string> = {
  concise: "Concise (150–200 words)",
  standard: "Standard (250–350 words)",
};

export const STRATEGY_LABELS: Record<GeneratorStrategy, string> = {
  template: "Template (deterministic)",
  ai: "AI-assisted",
};

export const REQUIREMENT_KIND_LABELS: Record<RequirementKind, string> = {
  skill: "Skill",
  tool: "Tool",
  responsibility: "Responsibility",
  softSkill: "Soft skill",
};

export const STATUS_BADGES: Record<CoverLetterStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: "Draft", tone: "warning" },
  final: { label: "Final", tone: "success" },
};

export function optionsOf<K extends string>(labels: Record<K, string>): Array<[K, string]> {
  return Object.entries(labels) as Array<[K, string]>;
}

/** "2026-10-02" → "Oct 2, 2026", read as a calendar date (no time zone shift). */
const calendarFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatCalendarDate(isoDate: string): string {
  return calendarFormatter.format(new Date(`${isoDate}T00:00:00Z`));
}
