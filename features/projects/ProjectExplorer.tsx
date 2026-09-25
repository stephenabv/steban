"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { SearchInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { ProjectGrid } from "./ProjectGrid";
import type { ProjectCardData } from "./types";
import styles from "./ProjectExplorer.module.less";

const MAX_FILTER_CHIPS = 10;
const ALL = "__all__";

/** Most-used technologies first, so the chip row surfaces meaningful filters. */
function rankTechnologies(projects: ProjectCardData[]): string[] {
  const counts = new Map<string, number>();
  for (const p of projects) {
    for (const t of p.technologies) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_FILTER_CHIPS)
    .map(([tech]) => tech);
}

export function ProjectExplorer({ projects }: { projects: ProjectCardData[] }) {
  const [query, setQuery] = useState("");
  const [tech, setTech] = useState<string>(ALL);
  const deferredQuery = useDeferredValue(query);

  const technologies = useMemo(() => rankTechnologies(projects), [projects]);

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return projects.filter((p) => {
      if (tech !== ALL && !p.technologies.includes(tech)) return false;
      if (!q) return true;
      return [p.title, p.summary, ...p.technologies].some((field) => field.toLowerCase().includes(q));
    });
  }, [projects, deferredQuery, tech]);

  const filtered = query.trim() !== "" || tech !== ALL;

  function reset() {
    setQuery("");
    setTech(ALL);
  }

  // Filtering only earns its space once there's something to filter.
  if (projects.length < 4) return <ProjectGrid projects={projects} />;

  return (
    <div className={styles.explorer}>
      <div className={styles.toolbar}>
        <SearchInput
          label="Search projects"
          placeholder="Search by name, summary or technology…"
          value={query}
          onValueChange={setQuery}
          className={styles.search}
        />
        {technologies.length > 1 && (
          <div className={styles.chips} role="group" aria-label="Filter by technology">
            {[ALL, ...technologies].map((t) => (
              <button
                key={t}
                type="button"
                className={cn(styles.chip, tech === t && styles.chipActive)}
                aria-pressed={tech === t}
                onClick={() => setTech(t)}
              >
                {t === ALL ? "All" : t}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className={styles.count} aria-live="polite">
        {filtered
          ? `${visible.length} of ${projects.length} projects`
          : `${projects.length} projects`}
      </p>

      <ProjectGrid
        projects={visible}
        emptyTitle="No matching projects"
        emptyDescription="Try a different search term or technology."
        emptyAction={
          <Button variant="secondary" icon="refresh" onClick={reset}>
            Clear filters
          </Button>
        }
      />
    </div>
  );
}
