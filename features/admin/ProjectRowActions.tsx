"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteProjectAction, updateProjectAction } from "./projectActions";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import styles from "./AdminPage.module.less";
import modalStyles from "@/components/ui/Modal.module.less";

export interface AdminProjectRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  coverImage: string;
  technologies: string[];
  features: string[];
  githubUrl?: string;
  liveUrl?: string;
  featured: boolean;
  publishedAt: string;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

  const [title, setTitle] = useState(project.title);
  const [slug, setSlug] = useState(project.slug);
  const [slugTouched, setSlugTouched] = useState(true);
  const [summary, setSummary] = useState(project.summary);
  const [description, setDescription] = useState(project.description);
  const [techStack, setTechStack] = useState(project.technologies.join(", "));
  const [features, setFeatures] = useState(project.features.join("\n"));
  const [liveUrl, setLiveUrl] = useState(project.liveUrl ?? "");
  const [repoUrl, setRepoUrl] = useState(project.githubUrl ?? "");
  const [imageUrl, setImageUrl] = useState(project.coverImage);
  const [featured, setFeatured] = useState(project.featured);

  function openEdit() {
    setTitle(project.title);
    setSlug(project.slug);
    setSlugTouched(true);
    setSummary(project.summary);
    setDescription(project.description);
    setTechStack(project.technologies.join(", "));
    setFeatures(project.features.join("\n"));
    setLiveUrl(project.liveUrl ?? "");
    setRepoUrl(project.githubUrl ?? "");
    setImageUrl(project.coverImage);
    setFeatured(project.featured);
    setError(null);
    setEditOpen(true);
  }

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const result = await updateProjectAction(project.id, {
        title,
        slug,
        summary,
        description,
        technologies: techStack.split(",").map((t) => t.trim()).filter(Boolean),
        features: features.split("\n").map((f) => f.trim()).filter(Boolean),
        coverImage: imageUrl.trim(),
        liveUrl: liveUrl.trim(),
        githubUrl: repoUrl.trim(),
        featured,
      });
      if (!result.ok) {
        setError(result.error ?? "Failed to save project.");
        return;
      }
      toast.success("Project updated.");
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
      toast.success("Project deleted.");
      setDeleteOpen(false);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className={styles.tableActions}>
        <button className={styles.tableActionBtn} type="button" onClick={() => setViewOpen(true)}>
          View
        </button>
        <button className={styles.tableActionBtn} type="button" onClick={openEdit}>
          Edit
        </button>
        <button
          className={`${styles.tableActionBtn} ${styles.danger}`}
          type="button"
          onClick={() => setDeleteOpen(true)}
        >
          Delete
        </button>
      </div>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title={project.title}>
        <p style={{ marginBottom: "0.75rem" }}>{project.summary || "No summary provided."}</p>
        {project.description && (
          <p style={{ whiteSpace: "pre-wrap", marginBottom: "1rem" }}>{project.description}</p>
        )}
        {project.technologies.length > 0 && (
          <p style={{ marginBottom: "0.5rem" }}>
            <strong>Tech stack:</strong> {project.technologies.join(", ")}
          </p>
        )}
        {project.features.length > 0 && (
          <>
            <p style={{ marginBottom: "0.25rem" }}>
              <strong>Features:</strong>
            </p>
            <ul style={{ marginBottom: "1rem", paddingLeft: "1.25rem" }}>
              {project.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </>
        )}
        <p>
          <strong>Published:</strong> {new Date(project.publishedAt).toLocaleDateString()}
        </p>
        <p style={{ marginTop: "1rem" }}>
          <Link href={`/projects/${project.slug}`} target="_blank" rel="noopener noreferrer">
            View live project page →
          </Link>
        </p>
      </Modal>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={`Edit "${project.title}"`}
        footer={
          <>
            <button
              type="button"
              className={modalStyles.btnCancel}
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              form={formId}
              className={modalStyles.btnPrimary}
              disabled={saving}
              aria-busy={saving}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </>
        }
      >
        {error && (
          <div className={styles.errorBanner} role="alert" style={{ marginBottom: "1rem" }}>
            {error}
          </div>
        )}
        <form id={formId} className={styles.form} onSubmit={onSave}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${formId}-title`}>Title</label>
              <input
                id={`${formId}-title`}
                type="text"
                className={styles.input}
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${formId}-slug`}>Slug</label>
              <input
                id={`${formId}-slug`}
                type="text"
                className={styles.input}
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                required
              />
            </div>
          </div>

          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor={`${formId}-summary`}>Summary</label>
            <input
              id={`${formId}-summary`}
              type="text"
              className={styles.input}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor={`${formId}-desc`}>Description</label>
            <textarea
              id={`${formId}-desc`}
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
            />
          </div>

          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor={`${formId}-tech`}>Tech Stack</label>
            <input
              id={`${formId}-tech`}
              type="text"
              className={styles.input}
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="Next.js, TypeScript, PostgreSQL"
            />
            <span className={styles.hint}>Comma-separated list of technologies.</span>
          </div>

          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor={`${formId}-features`}>Key Features</label>
            <textarea
              id={`${formId}-features`}
              className={styles.textarea}
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              rows={4}
            />
            <span className={styles.hint}>One feature per line.</span>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${formId}-live`}>Live URL</label>
              <input
                id={`${formId}-live`}
                type="url"
                className={styles.input}
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${formId}-repo`}>Repository URL</label>
              <input
                id={`${formId}-repo`}
                type="url"
                className={styles.input}
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${formId}-image`}>Cover Image URL</label>
              <input
                id={`${formId}-image`}
                type="url"
                className={styles.input}
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${formId}-featured`}>Featured</label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", padding: "0.6rem 0" }}>
                <input
                  id={`${formId}-featured`}
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#6366f1" }}
                />
                <span className={styles.hint} style={{ margin: 0 }}>Show in the featured carousel</span>
              </label>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={deleteOpen}
        title="Delete project"
        message={`Delete "${project.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        busy={deleting}
        onConfirm={onDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
}
