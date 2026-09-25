"use client";

import type { ReactNode } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { AdminPageHeader } from "./AdminPageHeader";
import styles from "./AdminPage.module.less";

interface Props {
  title: string;
  description: string;
  sectionTitle: string;
  sectionDescription?: string;
  saveLabel?: string;
  children: ReactNode;
}

/**
 * Frame for editors whose persistence isn't wired to the database yet
 * (see PLAN.md "Technical debt"). The form is fully usable, but feedback is
 * honest: nothing claims to have been saved.
 */
export function PlaceholderEditor({
  title,
  description,
  sectionTitle,
  sectionDescription,
  saveLabel = "Save changes",
  children,
}: Props) {
  const toast = useToast();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: call the section's Server Action once its repository is implemented.
    toast.info("Preview only — saving for this section isn't connected yet, so changes were not stored.");
  }

  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <AdminPageHeader title={title} description={description} />

      <Alert tone="warning" title="Not connected yet">
        This editor isn&apos;t linked to the database yet. You can draft values here, but they won&apos;t be saved or
        shown on the site.
      </Alert>

      <form onSubmit={onSubmit}>
        <Card padding="lg">
          <CardHeader title={sectionTitle} description={sectionDescription} />
          {children}
        </Card>
        <div className={styles.formActions}>
          <Button type="submit" icon="check">
            {saveLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
