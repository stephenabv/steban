import type { ExperienceEntry } from "@/server/domain/entities";

/** One HUD readout on the home hero: a number taken from the site's own data. */
export interface Readout {
  label: string;
  value: number;
}

export interface ReadoutSources {
  /** Published projects (the project list total), or null when it couldn't be read. */
  projectCount: number | null;
  skillCount: number;
  experience: readonly Pick<ExperienceEntry, "startDate">[];
  /** Injected for tests; defaults to the request time. */
  now?: Date;
}

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/** Whole years since the earliest experience start date, or null without any entries. */
export function yearsSinceFirstRole(
  experience: readonly Pick<ExperienceEntry, "startDate">[],
  now: Date = new Date()
): number | null {
  const starts = experience
    .map((e) => new Date(e.startDate).getTime())
    .filter((t) => Number.isFinite(t) && t <= now.getTime());
  if (starts.length === 0) return null;
  return Math.floor((now.getTime() - Math.min(...starts)) / MS_PER_YEAR);
}

/**
 * The hero readouts. Every number is derived from content the admin manages,
 * never typed in; a readout without data (or with zero) is left out rather
 * than shown as an empty "00".
 */
export function buildReadouts({ projectCount, skillCount, experience, now }: ReadoutSources): Readout[] {
  const years = yearsSinceFirstRole(experience, now);
  const candidates: Readout[] = [
    { label: "Projects shipped", value: projectCount ?? 0 },
    { label: "Core skills", value: skillCount },
    { label: "Years building", value: years ?? 0 },
  ];
  return candidates.filter((r) => r.value > 0);
}

/** Two-digit, zero-padded display ("06"), as on a HUD counter. */
export function formatReadout(value: number): string {
  return String(Math.max(0, Math.floor(value))).padStart(2, "0");
}

/** Lit cells of a fixed-length meter: one per unit, capped at the meter length. */
export function litCells(value: number, cells: number): number {
  return Math.min(Math.max(0, Math.floor(value)), cells);
}
