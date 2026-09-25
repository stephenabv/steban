"use client";

import type { ReactNode } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { adminLoginHref } from "@/lib/admin/sessionProbe";
import { Card, CardHeader } from "@/components/ui/Card";
import { AdminPageHeader, type AdminPageHeaderProps } from "../AdminPageHeader";
import type { ContentForm } from "./useContentForm";
import styles from "../AdminPage.module.less";

const savedFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

interface Props<T> {
  title: string;
  description: string;
  sectionTitle?: string;
  sectionDescription?: ReactNode;
  saveLabel?: string;
  /** Header extras for nested editors. */
  back?: AdminPageHeaderProps["back"];
  headerActions?: ReactNode;
  /** Rendered between the header and the form (e.g. a page switcher or an upload card). */
  beforeForm?: ReactNode;
  form: ContentForm<T>;
  children: ReactNode;
}

/** Page frame for admin content editors: header, error summary, card, sticky save bar. */
export function ContentEditor<T>({
  title,
  description,
  sectionTitle,
  sectionDescription,
  saveLabel = "Save changes",
  back,
  headerActions,
  beforeForm,
  form,
  children,
}: Props<T>) {
  const errorCount = Object.keys(form.errors).length;

  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <AdminPageHeader title={title} description={description} back={back} actions={headerActions} />
      {beforeForm}

      {form.formError && (
        <Alert
          tone="danger"
          title={form.formError}
          action={
            form.sessionExpired && (
              <Button href={adminLoginHref()} external variant="secondary" size="sm" icon="external">
                Sign in
              </Button>
            )
          }
        >
          {form.sessionExpired
            ? "Sign in again in the new tab, then come back and press Save — your edits are still here."
            : errorCount > 0 && `${errorCount} field${errorCount === 1 ? " needs" : "s need"} attention below.`}
        </Alert>
      )}

      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          void form.submit();
        }}
      >
        <Card padding="lg">
          {sectionTitle && <CardHeader title={sectionTitle} description={sectionDescription} />}
          {children}
        </Card>
        <div className={styles.formActions}>
          <span className={styles.formActionsHint} aria-live="polite">
            {form.isDirty
              ? "Unsaved changes"
              : form.savedAt
                ? `Last saved ${savedFormatter.format(new Date(form.savedAt))}`
                : "Not saved yet — the site is showing defaults"}
          </span>
          <Button type="submit" icon="check" loading={form.saving} loadingText="Saving…" disabled={!form.isDirty}>
            {saveLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
