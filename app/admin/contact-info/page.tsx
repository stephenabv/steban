"use client";

import { useState } from "react";
import styles from "@/features/admin/AdminPage.module.less";

export default function AdminContactInfoPage() {
  const [email, setEmail] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [facebook, setFacebook] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [saved, setSaved] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    // TODO: save via ContactService when DB is wired up
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Contact Information</h1>
        <p className={styles.subtitle}>Update contact details and social links shown on the Contact page.</p>
      </div>

      {saved && (
        <div className={styles.successBanner} role="status">✓ Contact info saved.</div>
      )}

      <form className={styles.card} onSubmit={onSave}>
        <h2 className={styles.cardTitle}>Contact Details</h2>
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ci-email">Email Address</label>
            <input id="ci-email" type="email" className={styles.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ci-github">GitHub URL</label>
            <input id="ci-github" type="url" className={styles.input} value={github} onChange={e => setGithub(e.target.value)} placeholder="https://github.com/..." />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ci-linkedin">LinkedIn URL</label>
            <input id="ci-linkedin" type="url" className={styles.input} value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ci-facebook">Facebook URL</label>
            <input id="ci-facebook" type="url" className={styles.input} value={facebook} onChange={e => setFacebook(e.target.value)} placeholder="https://facebook.com/..." />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ci-resume">Resume URL</label>
            <input id="ci-resume" type="url" className={styles.input} value={resumeUrl} onChange={e => setResumeUrl(e.target.value)} placeholder="/resume.pdf or https://..." />
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.btnSave}>Save Changes</button>
          </div>
        </div>
      </form>
    </div>
  );
}
