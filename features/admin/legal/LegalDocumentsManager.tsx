"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LegalDocumentKind } from "@/server/domain/entities";
import { LEGAL_DOCUMENTS } from "@/config/legal";
import { DataTable, type DataColumn } from "@/components/data/DataTable";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Segmented } from "@/components/ui/Segmented";
import { useToast } from "@/components/ui/ToastProvider";
import { AdminPageHeader } from "../AdminPageHeader";
import { createLegalDraftAction } from "../legalActions";
import { LEGAL_COMMANDS, unpublishCommand, type LegalCommandContext } from "./legalCommands";
import { LegalStatusBadge } from "./LegalStatusBadge";
import { LegalVersionActions } from "./LegalVersionActions";
import type { LegalVersionSummary } from "./LegalVersionDto";
import { useLegalCommands } from "./useLegalCommands";
import pageStyles from "../AdminPage.module.less";
import styles from "./Legal.module.less";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const formatDate = (iso: string | null) => (iso ? dateFormatter.format(new Date(iso)) : "—");

interface Props {
  basePath: string;
  kind: LegalDocumentKind;
  versions: LegalVersionSummary[];
  liveByKind: Record<LegalDocumentKind, LegalVersionSummary | null>;
}

/** Version list and live status for one legal document, with a switcher between documents. */
export function LegalDocumentsManager({ basePath, kind, versions, liveByKind }: Props) {
  const router = useRouter();
  const toast = useToast();
  const definition = LEGAL_DOCUMENTS[kind];
  const live = liveByKind[kind];
  const ctx: LegalCommandContext = { basePath, live, onVersionPage: false };
  const runner = useLegalCommands(ctx);
  const [creating, setCreating] = useState(false);
  const editHref = (v: LegalVersionSummary) => `${basePath}/legal/${v.id}`;

  async function createDraft() {
    setCreating(true);
    try {
      const result = await createLegalDraftAction(kind, live?.id);
      if (!result.ok || !result.id) {
        toast.error(result.error ?? "Couldn't create the draft.");
        return;
      }
      router.push(`${basePath}/legal/${result.id}`);
    } catch {
      toast.error("Network error — the draft wasn't created.");
    } finally {
      setCreating(false);
    }
  }

  const columns: DataColumn<LegalVersionSummary>[] = [
    {
      id: "version",
      header: "Version",
      mobile: "primary",
      cell: (v) => (
        <span className={pageStyles.cellText}>
          <Link href={editHref(v)} className={pageStyles.cellTitle}>
            Version {v.versionNumber}
          </Link>
          <span className={pageStyles.cellSub}>{v.title}</span>
        </span>
      ),
    },
    { id: "status", header: "Status", cell: (v) => <LegalStatusBadge status={v.status} /> },
    {
      id: "note",
      header: "Change note",
      mobile: "hidden",
      cell: (v) => <span className={pageStyles.cellSub}>{v.changeNote || "—"}</span>,
    },
    { id: "updated", header: "Last changed", cell: (v) => formatDate(v.updatedAt) },
    {
      id: "actions",
      header: "Actions",
      hideHeader: true,
      align: "end",
      mobile: "actions",
      cell: (v) => (
        <div className={styles.rowActions}>
          <Button
            href={editHref(v)}
            variant="ghost"
            size="sm"
            iconOnly
            icon={v.status === "draft" ? "pencil" : "eye"}
            aria-label={`${v.status === "draft" ? "Edit" : "View"} version ${v.versionNumber}`}
            title={v.status === "draft" ? "Edit" : "View"}
          />
          <LegalVersionActions version={v} commands={LEGAL_COMMANDS} runner={runner} compact />
        </div>
      ),
    },
  ];

  return (
    <div className={pageStyles.page}>
      <AdminPageHeader
        title="Legal pages"
        description="Draft, publish and unpublish versions of your Privacy Policy and Terms & Conditions."
        actions={
          <Button icon="plus" onClick={createDraft} loading={creating} loadingText="Creating…">
            {live ? "New draft from live version" : "New draft"}
          </Button>
        }
      />

      <div className={styles.stack}>
        <Segmented
          label="Document"
          value={kind}
          items={(Object.keys(LEGAL_DOCUMENTS) as LegalDocumentKind[]).map((key) => ({
            key,
            href: `${basePath}/legal?doc=${key}`,
            label: (
              <>
                {LEGAL_DOCUMENTS[key].label}
                {liveByKind[key] && <span className={styles.tabDot} aria-label="(published)" />}
              </>
            ),
          }))}
        />

        <Card padding="lg">
          <CardHeader title="Live on the website" description={definition.description} />
          {live ? (
            <div className={styles.live}>
              <div className={styles.liveText}>
                <p className={styles.liveTitle}>
                  Version {live.versionNumber} · {live.title}
                </p>
                <p className={styles.meta}>Published {formatDate(live.publishedAt)}</p>
              </div>
              <div className={styles.actions}>
                <Button href={definition.path} variant="ghost" icon="external" external>
                  View page
                </Button>
                <LegalVersionActions version={live} commands={[unpublishCommand]} runner={runner} />
              </div>
            </div>
          ) : (
            <Alert
              tone="info"
              title="Showing the built-in wording"
              action={
                <Button
                  href={definition.path}
                  variant="secondary"
                  size="sm"
                  icon="external"
                  external
                >
                  View page
                </Button>
              }
            >
              No version is published, so {definition.path} shows the default {definition.label}.
              Publish a version to replace it.
            </Alert>
          )}
        </Card>

        <Card padding="lg">
          <CardHeader
            title="Versions"
            description="Drafts are private. Published wording is read-only; change it with a new draft."
          />
          <DataTable
            caption={`${definition.label} versions`}
            columns={columns}
            rows={versions}
            getRowKey={(v) => v.id}
            empty={
              <EmptyState
                icon="file-text"
                title="No versions yet"
                description={`Start a draft from the built-in ${definition.label}, edit it, then publish it when you're ready.`}
                action={
                  <Button
                    icon="plus"
                    onClick={createDraft}
                    loading={creating}
                    loadingText="Creating…"
                  >
                    Start from built-in wording
                  </Button>
                }
              />
            }
          />
        </Card>
      </div>
      {runner.dialog}
    </div>
  );
}
