"use client";

import { useMemo, useState } from "react";
import { LEGAL_DOCUMENTS, LEGAL_LIMITS } from "@/config/legal";
import { Markup } from "@/lib/markup/Markup";
import { RichText } from "@/components/content/RichText";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { formLayout } from "@/components/ui/formLayout";
import { Segmented } from "@/components/ui/Segmented";
import { AdminPageHeader } from "../AdminPageHeader";
import { ContentEditor } from "../content/ContentEditor";
import { useContentForm } from "../content/useContentForm";
import { saveLegalDraftAction } from "../legalActions";
import { LEGAL_COMMANDS, type LegalCommandContext } from "./legalCommands";
import { LegalMarkupHelp } from "./LegalMarkupHelp";
import { LegalStatusBadge } from "./LegalStatusBadge";
import { LegalVersionActions } from "./LegalVersionActions";
import type { LegalVersionDetail, LegalVersionSummary } from "./LegalVersionDto";
import { useLegalCommands } from "./useLegalCommands";
import pageStyles from "../AdminPage.module.less";
import styles from "./Legal.module.less";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

interface Props {
  basePath: string;
  version: LegalVersionDetail;
  live: LegalVersionSummary | null;
}

function describe(version: LegalVersionSummary): string {
  const created = `Created ${dateFormatter.format(new Date(version.createdAt))}`;
  if (version.status === "published" && version.publishedAt) {
    return `Live since ${dateFormatter.format(new Date(version.publishedAt))}. ${created}.`;
  }
  if (version.status === "unpublished" && version.unpublishedAt) {
    return `Unpublished ${dateFormatter.format(new Date(version.unpublishedAt))}. ${created}.`;
  }
  return `${created}. Drafts are private until you publish them.`;
}

/** Edits a draft, or shows a published/unpublished version read-only. */
export function LegalVersionEditor(props: Props) {
  return props.version.status === "draft" ? <DraftEditor {...props} /> : <VersionViewer {...props} />;
}

function useVersionHeader({ basePath, version, live }: Props) {
  const definition = LEGAL_DOCUMENTS[version.kind];
  const ctx: LegalCommandContext = { basePath, live, onVersionPage: true };
  return {
    runner: useLegalCommands(ctx),
    title: `${definition.label} · Version ${version.versionNumber}`,
    back: { href: `${basePath}/legal?doc=${version.kind}`, label: "Legal pages" },
  };
}

function DraftEditor(props: Props) {
  const { version } = props;
  const { runner, title, back } = useVersionHeader(props);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const form = useContentForm(
    { title: version.title, body: version.body, changeNote: version.changeNote },
    version.updatedAt,
    (values) => saveLegalDraftAction(version.id, values),
    "Draft saved."
  );
  const { values, patch, errors } = form;
  const blocks = useMemo(() => (mode === "preview" ? Markup.parse(values.body) : []), [mode, values.body]);

  return (
    <>
      <ContentEditor
        title={title}
        description={describe(version)}
        back={back}
        headerActions={
          <LegalVersionActions
            version={version}
            commands={LEGAL_COMMANDS}
            runner={runner}
            disabled={form.isDirty ? { publish: "Save your changes before publishing." } : undefined}
          />
        }
        beforeForm={
          <div className={styles.editorBar}>
            <LegalStatusBadge status={version.status} />
            {form.isDirty && <span className={styles.meta}>Save your changes before publishing.</span>}
          </div>
        }
        sectionTitle="Draft"
        saveLabel="Save draft"
        form={form}
      >
        <div className={formLayout.grid}>
          <Field label="Page title" id="legal-title" required error={errors.title} count={{ value: values.title.length, max: LEGAL_LIMITS.titleMax }}>
            <Input type="text" value={values.title} onChange={(e) => patch({ title: e.target.value })} />
          </Field>
          <Field
            label="Change note"
            id="legal-note"
            optional
            error={errors.changeNote}
            hint="Internal — what changed in this version. Not shown on the site."
            count={{ value: values.changeNote.length, max: LEGAL_LIMITS.changeNoteMax }}
          >
            <Input type="text" value={values.changeNote} onChange={(e) => patch({ changeNote: e.target.value })} />
          </Field>
        </div>

        <div className={formLayout.span2}>
          <div className={styles.bodyTools}>
            <Segmented
              label="Editor view"
              value={mode}
              onChange={setMode}
              items={[
                { key: "write", label: "Write" },
                { key: "preview", label: "Preview" },
              ]}
            />
          </div>
          {mode === "write" ? (
            <Field
              label="Content"
              id="legal-body"
              required
              error={errors.body}
              count={{ value: values.body.length, max: LEGAL_LIMITS.bodyMax }}
            >
              <Textarea
                className={styles.source}
                value={values.body}
                onChange={(e) => patch({ body: e.target.value })}
                spellCheck
                rows={24}
              />
            </Field>
          ) : (
            <div className={styles.preview} role="region" aria-label="Content preview">
              <RichText blocks={blocks} />
            </div>
          )}
          <LegalMarkupHelp className={styles.help} />
        </div>
      </ContentEditor>
      {runner.dialog}
    </>
  );
}

function VersionViewer(props: Props) {
  const { version } = props;
  const { runner, title, back } = useVersionHeader(props);
  const blocks = useMemo(() => Markup.parse(version.body), [version.body]);

  return (
    <div className={`${pageStyles.page} ${pageStyles.narrow}`}>
      <AdminPageHeader
        title={title}
        description={describe(version)}
        back={back}
        actions={<LegalVersionActions version={version} commands={LEGAL_COMMANDS} runner={runner} />}
      />
      <div className={styles.stack}>
        <div className={styles.editorBar}>
          <LegalStatusBadge status={version.status} />
        </div>
        <Alert tone="info" title="This version is read-only">
          {version.status === "published"
            ? "Published wording can't be changed, so there's always a record of what visitors saw. Use “New draft from this” to make changes."
            : "Publish it again to restore it, or use “New draft from this” to make changes."}
        </Alert>
        <Card padding="lg">
          <CardHeader title={version.title} description={version.changeNote || undefined} />
          <div className={styles.readOnly}>
            <RichText blocks={blocks} />
          </div>
        </Card>
      </div>
      {runner.dialog}
    </div>
  );
}
