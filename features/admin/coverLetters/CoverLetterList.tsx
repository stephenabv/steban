"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/data/DataTable";
import type { DataColumn } from "@/components/data/DataTable";
import { DataToolbar } from "@/components/data/DataToolbar";
import { Pagination } from "@/components/data/Pagination";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListQuery, compareBy } from "@/lib/list/ListQuery";
import { useListQuery } from "@/lib/list/useListQuery";
import type { CoverLetterListItem } from "./CoverLetterDto";
import { DeleteCoverLetterButton } from "./DeleteCoverLetterButton";
import { STATUS_BADGES, formatCalendarDate } from "./coverLetterOptions";
import pageStyles from "../AdminPage.module.less";

const letterQuery = new ListQuery<CoverLetterListItem>({
  searchText: (letter) => [letter.companyName, letter.positionTitle],
  filters: [
    { id: "draft", label: "Drafts", predicate: (letter) => letter.status === "draft" },
    { id: "final", label: "Final", predicate: (letter) => letter.status === "final" },
  ],
  sorts: [
    {
      id: "updated",
      compare: compareBy.date((letter) => letter.updatedAt),
      labels: { desc: "Recently updated", asc: "Least recently updated" },
    },
    {
      id: "date",
      compare: compareBy.text((letter) => letter.letterDate),
      labels: { desc: "Letter date, newest", asc: "Letter date, oldest" },
    },
    {
      id: "company",
      compare: compareBy.text((letter) => letter.companyName),
      labels: { asc: "Company A–Z", desc: "Company Z–A" },
    },
  ],
});

export function CoverLetterList({
  letters,
  basePath,
}: {
  letters: CoverLetterListItem[];
  basePath: string;
}) {
  const router = useRouter();
  const list = useListQuery(letters, letterQuery, {
    sort: { id: "updated", direction: "desc" },
    pageSize: 10,
  });
  const listHref = `${basePath}/cover-letters`;

  const columns = useMemo<DataColumn<CoverLetterListItem>[]>(
    () => [
      {
        id: "company",
        header: "Company",
        sortId: "company",
        mobile: "primary",
        cell: (letter) => (
          <span className={pageStyles.cellText}>
            <span className={pageStyles.cellTitle}>{letter.companyName}</span>
            <span className={pageStyles.cellSub}>{letter.positionTitle}</span>
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: (letter) => (
          <Badge tone={STATUS_BADGES[letter.status].tone} dot>
            {STATUS_BADGES[letter.status].label}
          </Badge>
        ),
      },
      {
        id: "date",
        header: "Date",
        sortId: "date",
        sortInitial: "desc",
        cell: (letter) => (
          <time dateTime={letter.letterDate}>{formatCalendarDate(letter.letterDate)}</time>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        hideHeader: true,
        align: "end",
        mobile: "actions",
        cell: (letter) => {
          const name = `${letter.companyName} · ${letter.positionTitle}`;
          return (
            <div className={pageStyles.rowActions}>
              <Button
                href={`${listHref}/${letter.id}`}
                variant="secondary"
                size="sm"
                icon="pencil"
                aria-label={`Open ${name}`}
              >
                Open
              </Button>
              <DeleteCoverLetterButton
                id={letter.id}
                name={name}
                compact
                onDeleted={router.refresh}
              />
            </div>
          );
        },
      },
    ],
    [listHref, router]
  );

  if (letters.length === 0) {
    return (
      <EmptyState
        icon="file-text"
        title="No cover letters yet"
        description="Paste a job description and get a letter written from your portfolio."
        action={
          <Button href={`${listHref}/new`} icon="plus">
            Write your first letter
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <DataToolbar
        searchLabel="Search cover letters"
        searchPlaceholder="Search company or position…"
        search={list.state.search}
        onSearch={list.setSearch}
        filters={letterQuery.filters}
        filterId={list.state.filterId}
        filterCounts={list.result.filterCounts}
        onFilter={list.setFilter}
        sorts={letterQuery.sorts}
        sort={list.state.sort}
        onSort={list.setSort}
      />
      <DataTable
        caption="Cover letters"
        columns={columns}
        rows={list.result.items}
        getRowKey={(letter) => letter.id}
        sort={list.state.sort}
        onSort={list.toggleSort}
        empty={
          <EmptyState
            compact
            icon="search"
            title="No letters match"
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
        noun="letters"
        onPageChange={list.setPage}
      />
    </div>
  );
}
