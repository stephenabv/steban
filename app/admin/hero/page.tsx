"use client";

import { useState } from "react";
import styles from "@/features/admin/AdminPage.module.less";

export default function AdminHeroPage() {
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    // TODO: call Server Action / API when DB is wired up
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Hero Section</h1>
        <p className={styles.subtitle}>Edit your name, title, introduction, and photo shown in the hero.</p>
      </div>

      {saved && (
        <div className={styles.successBanner} role="status">
          ✓ Hero content saved successfully.
        </div>
      )}

      <form className={styles.card} onSubmit={onSave}>
        <h2 className={styles.cardTitle}>Hero Content</h2>
        <div className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="h-name">Display Name</label>
              <input id="h-name" type="text" className={styles.input} value={name} onChange={e => setName(e.target.value)} placeholder="Stephen Abueva" />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="h-title">Professional Title</label>
              <input id="h-title" type="text" className={styles.input} value={title} onChange={e => setTitle(e.target.value)} placeholder="Senior Software Engineer" />
            </div>
          </div>
          <div className={styles.fieldFull}>
            <label className={styles.label} htmlFor="h-intro">Introduction</label>
            <textarea id="h-intro" className={styles.textarea} value={introduction} onChange={e => setIntroduction(e.target.value)} placeholder="Short professional introduction..." rows={4} />
          </div>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="h-photo">Profile Photo URL</label>
              <input id="h-photo" type="url" className={styles.input} value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="https://..." />
              <span className={styles.hint}>Upload to Vercel Blob and paste the URL here.</span>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="h-resume">Resume URL</label>
              <input id="h-resume" type="url" className={styles.input} value={resumeUrl} onChange={e => setResumeUrl(e.target.value)} placeholder="/resume.pdf or https://..." />
            </div>
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.btnSave}>Save Changes</button>
          </div>
        </div>
      </form>
    </div>
  );
}
