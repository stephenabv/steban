"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createProjectAction } from "./projectActions";
import styles from "./AdminPage.module.less";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function NewProjectForm({ basePath }: { basePath: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [features, setFeatures] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [featured, setFeatured] = useState(false);

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
      const result = await createProjectAction({
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
      router.push(`${basePath}/projects`);
      router.refresh();
    } catch {
      setError("Something went wrong while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>New Project</h1>
        <p className={styles.subtitle}>Add a new project to your portfolio.</p>
      </div>

      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
        </div>
      )}

      <form className={styles.card} onSubmit={onSave}>
        <h2 className={styles.cardTitle}>Project Details</h2>
        <div className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="p-title">Title</label>
              <input id="p-title" type="text" className={styles.input} value={title} onChange={e => onTitleChange(e.target.value)} placeholder="My Awesome Project" required />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="p-slug">Slug</label>
              <input
                id="p-slug"
                type="text"
                className={styles.input}
                value={slug}
                onChange={e => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="my-awesome-project"
                required
              />
              <span className={styles.hint}>Used in the URL: /projects/{slug || "my-awesome-project"}</span>
            </div>
          </div>

          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="p-summary">Summary</label>
            <input id="p-summary" type="text" className={styles.input} value={summary} onChange={e => setSummary(e.target.value)} placeholder="One-line description shown on project cards" />
          </div>

          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="p-desc">Description</label>
            <textarea id="p-desc" className={styles.textarea} value={description} onChange={e => setDescription(e.target.value)} placeholder="Full project description, features, challenges..." rows={6} />
          </div>

          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="p-tech">Tech Stack</label>
            <input id="p-tech" type="text" className={styles.input} value={techStack} onChange={e => setTechStack(e.target.value)} placeholder="Next.js, TypeScript, PostgreSQL" />
            <span className={styles.hint}>Comma-separated list of technologies.</span>
          </div>

          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="p-features">Key Features</label>
            <textarea id="p-features" className={styles.textarea} value={features} onChange={e => setFeatures(e.target.value)} placeholder={"Real-time collaboration\nOffline support\nRole-based access control"} rows={4} />
            <span className={styles.hint}>One feature per line — shown on the project detail page.</span>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="p-live">Live URL</label>
              <input id="p-live" type="url" className={styles.input} value={liveUrl} onChange={e => setLiveUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="p-repo">Repository URL</label>
              <input id="p-repo" type="url" className={styles.input} value={repoUrl} onChange={e => setRepoUrl(e.target.value)} placeholder="https://github.com/..." />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="p-image">Cover Image URL</label>
              <input id="p-image" type="url" className={styles.input} value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
              <span className={styles.hint}>Upload to Vercel Blob and paste the URL here.</span>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="p-featured">Featured</label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", padding: "0.6rem 0" }}>
                <input id="p-featured" type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} style={{ width: 16, height: 16, accentColor: "#6366f1" }} />
                <span className={styles.hint} style={{ margin: 0 }}>Show in the featured carousel on the home page</span>
              </label>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="submit" className={styles.btnSave} disabled={saving} aria-busy={saving}>
              {saving ? "Saving…" : "Save Project"}
            </button>
            <Link href={`${basePath}/projects`} className={styles.btnCancel} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
