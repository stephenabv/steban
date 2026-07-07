"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import styles from "@/features/admin/AdminPage.module.less";

const PAGE_KEYS = ["home", "projects", "about", "contact"];

export default function AdminSeoPage() {
  const toast = useToast();
  const [pageKey, setPageKey] = useState("home");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [noIndex, setNoIndex] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    // TODO: save via SeoService when DB is wired up
    toast.success("SEO metadata saved.");
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>SEO Metadata</h1>
        <p className={styles.subtitle}>Edit page-level title, description, and Open Graph data.</p>
      </div>

      <form className={styles.card} onSubmit={onSave}>
        <h2 className={styles.cardTitle}>Edit Page SEO</h2>
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="seo-page">Page</label>
            <select id="seo-page" className={styles.select} value={pageKey} onChange={e => setPageKey(e.target.value)}>
              {PAGE_KEYS.map(k => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="seo-title">Page Title</label>
            <input id="seo-title" type="text" className={styles.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="Page Title | Stephen Abueva" />
            <span className={styles.hint}>Recommended: 50–60 characters.</span>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="seo-desc">Meta Description</label>
            <textarea id="seo-desc" className={styles.textarea} rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Concise page description for search engines..." />
            <span className={styles.hint}>Recommended: 120–158 characters.</span>
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="seo-kw">Keywords (comma-separated)</label>
            <input id="seo-kw" type="text" className={styles.input} value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="software engineer, full-stack, Next.js" />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="seo-og">OG Image URL</label>
            <input id="seo-og" type="url" className={styles.input} value={ogImageUrl} onChange={e => setOgImageUrl(e.target.value)} placeholder="https://... (1200×630 recommended)" />
          </div>
          <div className={styles.field}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input type="checkbox" checked={noIndex} onChange={e => setNoIndex(e.target.checked)} />
              <span className={styles.label} style={{ margin: 0 }}>Exclude from search engines (noindex)</span>
            </label>
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.btnSave}>Save SEO</button>
          </div>
        </div>
      </form>
    </div>
  );
}
