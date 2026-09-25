"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProjectAction } from "./projectActions";
import { useToast } from "@/components/ui/ToastProvider";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AdminPageHeader } from "./AdminPageHeader";
import { ProjectFormFields } from "./projects/ProjectFormFields";
import { ProjectFormModel } from "./projects/ProjectFormModel";
import { useProjectForm } from "./projects/useProjectForm";
import styles from "./AdminPage.module.less";

export function NewProjectForm({ basePath }: { basePath: string }) {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const form = useProjectForm(ProjectFormModel.empty(), { slugLocked: false });

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const result = await createProjectAction(ProjectFormModel.toActionInput(form.values));
      if (!result.ok) {
        setError(result.error ?? "Failed to save project.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      toast.success(`"${form.values.title}" created.`);
      router.push(`${basePath}/projects`);
      router.refresh();
    } catch {
      setError("Something went wrong while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <AdminPageHeader
        title="New project"
        description="Add a new project to your portfolio."
        back={{ href: `${basePath}/projects`, label: "Projects" }}
      />

      {error && <Alert tone="danger" title="Couldn't save the project">{error}</Alert>}

      <form onSubmit={onSave}>
        <Card padding="lg">
          <ProjectFormFields form={form} idPrefix="new-project" />
        </Card>
        <div className={styles.formActions}>
          <span className={styles.formActionsHint}>Fields marked * are required.</span>
          <Button href={`${basePath}/projects`} variant="secondary">
            Cancel
          </Button>
          <Button type="submit" icon="check" loading={saving} loadingText="Saving…">
            Save project
          </Button>
        </div>
      </form>
    </div>
  );
}
