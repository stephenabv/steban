"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LetterLengthPolicy } from "@/server/domain/coverLetter";
import type { GeneratorStrategy, LengthFit } from "@/server/domain/coverLetter";
import { COVER_LETTER_EDIT_LIMITS as EDIT_LIMITS } from "@/server/security/coverLetterSchemas";
import type { RegenerateCoverLetterInput } from "@/server/security/coverLetterSchemas";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import type { BadgeTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import type { CoverLetterView } from "./CoverLetterDto";
import { DeleteCoverLetterButton } from "./DeleteCoverLetterButton";
import { ExportLinks } from "./ExportLinks";
import { LetterPreview } from "./LetterPreview";
import { RegenerateModal } from "./RegenerateModal";
import { MatchedRequirements, RequirementGaps } from "./RequirementPanel";
import { LENGTH_LABELS, STATUS_BADGES, STRATEGY_LABELS } from "./coverLetterOptions";
import { useCoverLetterEditor } from "./useCoverLetterEditor";
import type { CoverLetterEditorState } from "./useCoverLetterEditor";
import styles from "./CoverLetters.module.less";
import pageStyles from "../AdminPage.module.less";

type EditorView = "edit" | "preview";

const LENGTH_FIT: Record<LengthFit, { tone: BadgeTone; label: string }> = {
  under: { tone: "warning", label: "below target" },
  within: { tone: "success", label: "on target" },
  over: { tone: "warning", label: "above target" },
};

interface CoverLetterEditorProps {
  initial: CoverLetterView;
  strategies: readonly GeneratorStrategy[];
  basePath: string;
}

export function CoverLetterEditor({ initial, strategies, basePath }: CoverLetterEditorProps) {
  const router = useRouter();
  const editor = useCoverLetterEditor(initial);
  const { letter } = editor;
  const editable = editor.can("edit");
  const [view, setView] = useState<EditorView>(editable ? "edit" : "preview");
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const listHref = `${basePath}/cover-letters`;
  const name = `${letter.application.companyName} · ${letter.application.positionTitle}`;

  async function onSave(event: FormEvent) {
    event.preventDefault();
    await editor.save();
  }

  async function onRegenerate(options: RegenerateCoverLetterInput) {
    if (await editor.regenerate(options)) setRegenerateOpen(false);
  }

  return (
    <>
      <Messages editor={editor} />

      <div className={styles.workspace}>
        <form onSubmit={onSave} aria-label="Cover letter">
          <Card padding="lg">
            <div className={styles.toolbar}>
              <Segmented<EditorView>
                label="View"
                value={view}
                onChange={setView}
                items={[
                  { key: "edit", label: editable ? "Edit" : "Text" },
                  { key: "preview", label: "Preview" },
                ]}
              />
              <LetterMeta editor={editor} />
            </div>

            {!editable && (
              <Alert tone="info" title="This letter is final">
                Reopen it as a draft to change it.
              </Alert>
            )}

            {view === "edit" ? (
              <LetterFields editor={editor} readOnly={!editable} />
            ) : (
              <LetterPreview sections={editor.sections} />
            )}
          </Card>

          <div className={pageStyles.formActions}>
            <span className={pageStyles.formActionsHint} aria-live="polite">
              {editor.dirty ? "Unsaved changes" : "All changes saved"}
            </span>
            {editable ? (
              <>
                <Button
                  variant="ghost"
                  onClick={editor.discard}
                  disabled={!editor.dirty || editor.pending !== null}
                >
                  Discard
                </Button>
                <Button
                  type="submit"
                  variant="secondary"
                  icon="check"
                  disabled={!editor.dirty}
                  loading={editor.pending === "save"}
                  loadingText="Saving…"
                >
                  Save draft
                </Button>
                <Button
                  icon="check-circle"
                  onClick={editor.finalize}
                  disabled={editor.dirty || editor.pending !== null}
                  loading={editor.pending === "finalize"}
                  title={editor.dirty ? "Save your edits first" : undefined}
                >
                  Mark final
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                icon="pencil"
                onClick={editor.reopen}
                loading={editor.pending === "reopen"}
                loadingText="Reopening…"
              >
                Reopen as draft
              </Button>
            )}
          </div>
        </form>

        <aside className={styles.aside} aria-label="Letter tools">
          <Card as="section" aria-labelledby="letter-actions">
            <CardHeader as="h3" id="letter-actions" title="Actions" />
            <div className={pageStyles.stack}>
              <div className={styles.toolbarGroup}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon="refresh"
                  onClick={() => setRegenerateOpen(true)}
                  disabled={!editor.can("regenerate") || editor.pending !== null}
                >
                  Regenerate
                </Button>
                <Button variant="secondary" size="sm" icon="copy" onClick={editor.copy}>
                  Copy text
                </Button>
                <Button
                  href={`${listHref}/new?from=${encodeURIComponent(letter.id)}`}
                  variant="secondary"
                  size="sm"
                  icon="layers"
                >
                  Duplicate for new company
                </Button>
              </div>
              <div className={styles.toolbarGroup} role="group" aria-label="Download">
                <ExportLinks id={letter.id} disabled={editor.dirty} />
              </div>
              <div>
                <DeleteCoverLetterButton
                  id={letter.id}
                  name={name}
                  variant="danger"
                  onDeleted={() => router.replace(listHref)}
                />
              </div>
            </div>
          </Card>
          <MatchedRequirements matches={letter.matches} />
          <RequirementGaps gaps={letter.gaps} />
        </aside>
      </div>

      <RegenerateModal
        key={`${letter.id}:${letter.updatedAt}`}
        open={regenerateOpen}
        initial={{
          strategy: strategies.includes(letter.generator)
            ? letter.generator
            : (strategies[0] ?? "template"),
          tone: letter.application.tone,
          length: letter.application.length,
        }}
        strategies={strategies}
        hasUnsavedEdits={editor.dirty}
        busy={editor.pending === "regenerate"}
        onClose={() => setRegenerateOpen(false)}
        onConfirm={onRegenerate}
      />
    </>
  );
}

function Messages({ editor }: { editor: CoverLetterEditorState }) {
  return (
    <>
      {editor.error && (
        <Alert tone="danger" title="That didn't work">
          {editor.error}
        </Alert>
      )}
      {editor.notices.map((notice) => (
        <Alert key={notice} tone="info">
          {notice}
        </Alert>
      ))}
      {editor.warnings.length > 0 && (
        <Alert
          tone="warning"
          title={"Saved. Your profile doesn't show these, so check the claims:"}
        >
          <ul>
            {editor.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </Alert>
      )}
    </>
  );
}

function LetterMeta({ editor }: { editor: CoverLetterEditorState }) {
  const { letter, wordCount } = editor;
  const status = STATUS_BADGES[letter.status];
  const band = LetterLengthPolicy.band(letter.application.length);
  const fit = LENGTH_FIT[LetterLengthPolicy.assess(letter.application.length, wordCount)];

  return (
    <div className={styles.metaRow}>
      <Badge tone={status.tone} dot>
        {status.label}
      </Badge>
      <Badge
        tone={fit.tone}
        title={`${LENGTH_LABELS[letter.application.length]}: ${band.min}–${band.max} words`}
      >
        {wordCount} words, {fit.label}
      </Badge>
      <span>{STRATEGY_LABELS[letter.generator]}</span>
    </div>
  );
}

/** Header, recipient and sign-off come from data; only the prose is editable. */
function LetterFields({ editor, readOnly }: { editor: CoverLetterEditorState; readOnly: boolean }) {
  const { sections, draft, fieldErrors } = editor;

  return (
    <div className={pageStyles.stack}>
      <div className={styles.fixed}>
        {[sections.header.fullName, ...sections.header.lines].join("\n")}
      </div>
      <Field label="Date" required error={fieldErrors.date}>
        <Input
          value={draft.date}
          maxLength={EDIT_LIMITS.date}
          readOnly={readOnly}
          onChange={(e) => editor.setDate(e.target.value)}
        />
      </Field>
      <div className={styles.fixed}>{sections.recipient.join("\n")}</div>
      <Field label="Salutation" required error={fieldErrors.salutation}>
        <Input
          value={draft.salutation}
          maxLength={EDIT_LIMITS.salutation}
          readOnly={readOnly}
          onChange={(e) => editor.setSalutation(e.target.value)}
        />
      </Field>
      {draft.body.map((paragraph, index) => (
        <Field
          key={index}
          label={`Paragraph ${index + 1}`}
          required
          hint={index === 0 ? "Wrap words in **double asterisks** to bold them." : undefined}
          error={fieldErrors[`body.${index}`]}
          count={{ value: paragraph.length, max: EDIT_LIMITS.paragraph }}
        >
          <Textarea
            className={styles.paragraph}
            value={paragraph}
            maxLength={EDIT_LIMITS.paragraph}
            readOnly={readOnly}
            onChange={(e) => editor.setParagraph(index, e.target.value)}
          />
        </Field>
      ))}
      <div className={styles.fixed}>{[...sections.closing, sections.signature].join("\n")}</div>
    </div>
  );
}
