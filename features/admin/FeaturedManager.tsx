"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProjectAction } from "./projectActions";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput, Switch } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/ToastProvider";
import { ProjectFormModel } from "./projects/ProjectFormModel";
import type { AdminProjectRow } from "./projects/ProjectFormModel";
import { MAX_FEATURED } from "./constants";
import styles from "./AdminPage.module.less";


interface Props {
  /** Featured projects in carousel order (as returned by the service). */
  featured: AdminProjectRow[];
  others: AdminProjectRow[];
  newHref: string;
}

export function FeaturedManager({ featured, others, newHref }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  // Optimistic featured-id set: the switch flips immediately, then the server confirms.
  const [featuredIds, applyToggle] = useOptimistic(
    new Set(featured.map((p) => p.id)),
    (current: Set<string>, { id, on }: { id: string; on: boolean }) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    }
  );

  const all = [...featured, ...others];
  const atCapacity = featuredIds.size >= MAX_FEATURED;
  const q = query.trim().toLowerCase();
  const available = others.filter(
    (p) => !featuredIds.has(p.id) && (!q || `${p.title} ${p.slug} ${p.technologies.join(" ")}`.toLowerCase().includes(q))
  );
  const inCarousel = all.filter((p) => featuredIds.has(p.id));

  function toggle(project: AdminProjectRow, on: boolean) {
    setPendingId(project.id);
    startTransition(async () => {
      applyToggle({ id: project.id, on });
      try {
        const result = await updateProjectAction(project.id, ProjectFormModel.withOverrides(project, { featured: on }));
        if (!result.ok) {
          toast.error(result.error ?? "Couldn't update the project.");
          return;
        }
        toast.success(on ? `"${project.title}" added to the carousel.` : `"${project.title}" removed from the carousel.`);
        router.refresh();
      } catch {
        toast.error("Something went wrong. Please try again.");
      } finally {
        setPendingId(null);
      }
    });
  }

  if (all.length === 0) {
    return (
      <EmptyState
        icon="star"
        title="No projects to feature yet"
        description="Add projects first, then return here to choose which ones headline the home page."
        action={
          <Button href={newHref} icon="plus">
            New project
          </Button>
        }
      />
    );
  }

  return (
    <div className={styles.stack}>
      <Card>
        <CardHeader
          title="In the carousel"
          description="Shown on the home page, in this order."
          actions={
            <Badge tone={atCapacity ? "warning" : "accent"}>
              {featuredIds.size} / {MAX_FEATURED}
            </Badge>
          }
        />
        {inCarousel.length === 0 ? (
          <EmptyState compact icon="star" title="Nothing featured" description="The carousel is hidden until at least one project is featured." />
        ) : (
          <ol className={styles.list} role="list">
            {inCarousel.map((p, i) => (
              <li key={p.id} className={styles.listItem}>
                <Badge>{i + 1}</Badge>
                <div className={styles.listMain}>
                  <span className={styles.listTitle}>{p.title}</span>
                  <span className={styles.listMeta}>/projects/{p.slug}</span>
                </div>
                <Switch
                  label={<span className="sr-only">Featured: {p.title}</span>}
                  checked
                  disabled={pendingId !== null}
                  onCheckedChange={(on) => toggle(p, on)}
                />
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card>
        <CardHeader title="Available projects" description="Switch a project on to add it to the carousel." />
        {atCapacity && (
          <Alert tone="info" className={styles.formError}>
            The carousel is full. Remove a project above to feature another one.
          </Alert>
        )}
        <SearchInput label="Search available projects" placeholder="Search projects…" value={query} onValueChange={setQuery} />
        {available.length === 0 ? (
          <p className={styles.muted} style={{ marginTop: "1rem" }}>
            {q ? "No projects match your search." : "Every project is already featured."}
          </p>
        ) : (
          <ul className={styles.list} role="list" style={{ marginTop: "1rem" }}>
            {available.map((p) => (
              <li key={p.id} className={styles.listItem}>
                <div className={styles.listMain}>
                  <span className={styles.listTitle}>{p.title}</span>
                  <span className={styles.listMeta}>/projects/{p.slug}</span>
                </div>
                <Switch
                  label={<span className="sr-only">Feature {p.title}</span>}
                  checked={false}
                  disabled={atCapacity || pendingId !== null}
                  onCheckedChange={(on) => toggle(p, on)}
                />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
