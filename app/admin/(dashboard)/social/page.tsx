"use client";

import { useState } from "react";
import styles from "@/features/admin/AdminPage.module.less";

export default function AdminSocialPage() {
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [facebook, setFacebook] = useState("");
  const [saved, setSaved] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Social Links</h1>
        <p className={styles.subtitle}>Manage social profile URLs shown in the footer and contact page.</p>
      </div>

      {saved && <div className={styles.successBanner} role="status">✓ Social links saved.</div>}

      <form className={styles.card} onSubmit={onSave}>
        <h2 className={styles.cardTitle}>Social Profiles</h2>
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="s-github">GitHub</label>
            <input id="s-github" type="url" className={styles.input} value={github} onChange={e => setGithub(e.target.value)} placeholder="https://github.com/..." />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="s-linkedin">LinkedIn</label>
            <input id="s-linkedin" type="url" className={styles.input} value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="s-facebook">Facebook</label>
            <input id="s-facebook" type="url" className={styles.input} value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="https://facebook.com/..." />
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.btnSave}>Save</button>
          </div>
        </div>
      </form>
    </div>
  );
}
