"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProjectAction, updateProjectAction } from "./projectActions";
import { Modal, ModalFooterStart } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/ToastProvider";
import { ProjectFormFields } from "./projects/ProjectFormFields";
import { ProjectFormModel } from "./projects/ProjectFormModel";
import type { AdminProjectRow } from "./projects/ProjectFormModel";
import { useProjectForm } from "./projects/useProjectForm";
import styles from "./AdminPage.module.less";

export type { AdminProjectRow } from "./projects/ProjectFormModel";

const dateFormatter = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" });

export function ProjectRowActions({ project }: { project: AdminProjectRow }) {
  const router = useRouter();
  const toast = useToast();
  const formId = `edit-project-${project.id}`;

  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useProjectForm(ProjectFormModel.fromProject(project), { slugLocked: true });

  function openEdit() {
    form.reset(ProjectFormModel.fromProject(project), true);
    setError(null);
    setViewOpen(false);
    setEditOpen(true);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const result = await updateProjectAction(project.id, ProjectFormModel.toActionInput(form.values));
      if (!result.ok) {
        setError(result.error ?? "Failed to save project.");
        return;
      }
      toast.success(`"${form.values.title}" updated.`);
      setEditOpen(false);
      router.refresh();
    } catch {
      setError("Something went wrong while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    setDeleting(true);
    try {
      const result = await deleteProjectAction(project.id);
      if (!result.ok) {
        toast.error(result.error ?? "Failed to delete project.");
        return;
      }
      toast.success(`"${project.title}" deleted.`);
      setDeleteOpen(false);
      router.refresh();
    } catch {
      toast.error("Something went wrong while deleting. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className={styles.rowActions}>
        <Button variant="ghost" size="sm" icon="eye" onClick={() => setViewOpen(true)} aria-label={`View ${project.title}`}>
          View
        </Button>
        <Button variant="secondary" size="sm" icon="pencil" onClick={openEdit} aria-label={`Edit ${project.title}`}>
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon="trash"
          iconOnly
          onClick={() => setDeleteOpen(true)}
          aria-label={`Delete ${project.title}`}
          title="Delete"
        />
      </div>

      <Modal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        title={project.title}
        description={`/projects/${project.slug}`}
        size="lg"
        footer={
          <>
            <Button href={`/projects/${project.slug}`} variant="ghost" icon="external" external>
              Open public page
            </Button>
            <Button icon="pencil" onClick={openEdit}>
              Edit project
            </Button>
          </>
        }
      >
        <dl className={styles.messageMeta}>
          <div>
            <dt>Status</dt>
            <dd>{project.featured ? <Badge tone="accent">Featured</Badge> : <Badge>Standard</Badge>}</dd>
          </div>
          <div>
            <dt>Published</dt>
            <dd>{dateFormatter.format(new Date(project.publishedAt))}</dd>
          </div>
          {project.technologies.length > 0 && (
            <div>
              <dt>Stack</dt>
              <dd>{project.technologies.join(", ")}</dd>
            </div>
          )}
        </dl>
        <p className={styles.messageBody}>{project.summary || "No summary provided."}</p>
        {project.description && (
          <p className={styles.messageBody} style={{ marginTop: "1rem" }}>
            {project.description}
          </p>
        )}
        {project.features.length > 0 && (
          <ul style={{ marginTop: "1rem", paddingLeft: "1.25rem" }}>
            {project.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit project"
        description={project.title}
        size="lg"
        dismissible={!saving}
        footer={
          <>
            {form.isDirty && (
              <ModalFooterStart>
                <span className={styles.formActionsHint}>Unsaved changes</span>
              </ModalFooterStart>
            )}
            <Button variant="secondary" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form={formId} icon="check" loading={saving} loadingText="Saving…" disabled={!form.isDirty}>
              Save changes
            </Button>
          </>
        }
      >
        {error && (
          <Alert tone="danger" className={styles.formError}>
            {error}
          </Alert>
        )}
        <form id={formId} onSubmit={onSave}>
          <ProjectFormFields form={form} idPrefix={formId} />
        </form>
      </Modal>

      <ConfirmModal
        open={deleteOpen}
        title="Delete project?"
        message={
          <>
            <strong>{project.title}</strong> will be removed from the portfolio and its public page will stop
            working. This cannot be undone.
          </>
        }
        confirmLabel="Delete project"
        danger
        busy={deleting}
        onConfirm={onDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}
