"use client";

import { useMemo } from "react";
import { DataTable } from "@/components/data/DataTable";
import type { DataColumn } from "@/components/data/DataTable";
import { DataToolbar } from "@/components/data/DataToolbar";
import { Pagination } from "@/components/data/Pagination";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/icons/Icon";
import { ListQuery, compareBy } from "@/lib/list/ListQuery";
import { useListQuery } from "@/lib/list/useListQuery";
import { ProjectRowActions } from "./ProjectRowActions";
import type { AdminProjectRow } from "./projects/ProjectFormModel";
import styles from "./AdminPage.module.less";

const projectQuery = new ListQuery<AdminProjectRow>({
  searchText: (p) => [p.title, p.slug, p.summary, ...p.technologies],
  filters: [
    { id: "featured", label: "Featured", predicate: (p) => p.featured },
    { id: "standard", label: "Not featured", predicate: (p) => !p.featured },
  ],
  sorts: [
    {
      id: "published",
      compare: compareBy.date((p) => p.publishedAt),
      labels: { desc: "Newest first", asc: "Oldest first" },
    },
    {
      id: "title",
      compare: compareBy.text((p) => p.title),
      labels: { asc: "Title A–Z", desc: "Title Z–A" },
    },
    {
      id: "updated",
      compare: compareBy.date((p) => p.updatedAt),
      labels: { desc: "Recently updated", asc: "Least recently updated" },
    },
  ],
});

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export function ProjectsTable({ projects, newHref }: { projects: AdminProjectRow[]; newHref: string }) {
  const list = useListQuery(projects, projectQuery, { sort: { id: "published", direction: "desc" }, pageSize: 10 });

  const columns = useMemo<DataColumn<AdminProjectRow>[]>(
    () => [
      {
        id: "project",
        header: "Project",
        sortId: "title",
        mobile: "primary",
        cell: (p) => (
          <div className={styles.cellPrimary}>
            <span className={styles.thumb} aria-hidden="true">
              {p.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.coverImage} alt="" loading="lazy" />
              ) : (
                <Icon name="image" size={16} />
              )}
            </span>
            <span className={styles.cellText}>
              <span className={styles.cellTitle}>{p.title}</span>
              <span className={styles.cellSub}>/projects/{p.slug}</span>
            </span>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (p) => (p.featured ? <Badge tone="accent" dot>Featured</Badge> : <Badge>Standard</Badge>),
      },
      {
        id: "tech",
        header: "Stack",
        mobile: "hidden",
        cell: (p) =>
          p.technologies.length > 0 ? (
            <span className={styles.cellSub}>
              {p.technologies.slice(0, 3).join(", ")}
              {p.technologies.length > 3 ? ` +${p.technologies.length - 3}` : ""}
            </span>
          ) : (
            <span className={styles.cellSub}>—</span>
          ),
      },
      {
        id: "published",
        header: "Published",
        sortId: "published",
        sortInitial: "desc",
        cell: (p) => <time dateTime={p.publishedAt}>{dateFormatter.format(new Date(p.publishedAt))}</time>,
      },
      {
        id: "actions",
        header: "Actions",
        hideHeader: true,
        align: "end",
        mobile: "actions",
        cell: (p) => <ProjectRowActions project={p} />,
      },
    ],
    []
  );

  if (projects.length === 0) {
    return (
      <EmptyState
        icon="layers"
        title="No projects yet"
        description="Projects you add here appear on the public Projects page."
        action={
          <Button href={newHref} icon="plus">
            Add your first project
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <DataToolbar
        searchLabel="Search projects"
        searchPlaceholder="Search title, slug or technology…"
        search={list.state.search}
        onSearch={list.setSearch}
        filters={projectQuery.filters}
        filterId={list.state.filterId}
        filterCounts={list.result.filterCounts}
        onFilter={list.setFilter}
        sorts={projectQuery.sorts}
        sort={list.state.sort}
        onSort={list.setSort}
      />
      <DataTable
        caption="Projects"
        columns={columns}
        rows={list.result.items}
        getRowKey={(p) => p.id}
        sort={list.state.sort}
        onSort={list.toggleSort}
        empty={
          <EmptyState
            compact
            icon="search"
            title="No projects match"
            description="Try a different search or filter."
            action={
              <Button variant="secondary" size="sm" icon="refresh" onClick={list.reset}>
                Clear filters
              </Button>
            }
          />
        }
      />
      <Pagination
        page={list.result.page}
        totalPages={list.result.totalPages}
        rangeStart={list.result.rangeStart}
        rangeEnd={list.result.rangeEnd}
        total={list.result.total}
        noun="projects"
        onPageChange={list.setPage}
      />
    </div>
  );
}
