import type { ExperienceEntry } from "@/server/domain/entities";

const time = (d: Date | undefined) => (d ? new Date(d).getTime() : Number.NEGATIVE_INFINITY);

/**
 * Most recent role first, down to the very first job:
 * current roles lead (latest start first), then past roles by end date,
 * with the start date as the tie-breaker. Input order doesn't matter.
 */
export function compareExperienceNewestFirst(a: ExperienceEntry, b: ExperienceEntry): number {
  if (a.current !== b.current) return a.current ? -1 : 1;
  const byEnd = a.current ? 0 : time(b.endDate ?? b.startDate) - time(a.endDate ?? a.startDate);
  return byEnd || time(b.startDate) - time(a.startDate);
}

export function sortExperienceNewestFirst(entries: readonly ExperienceEntry[]): ExperienceEntry[] {
  return [...entries].sort(compareExperienceNewestFirst);
}
