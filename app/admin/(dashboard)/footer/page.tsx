"use client";

import { useState } from "react";
import styles from "@/features/admin/AdminPage.module.less";

export default function AdminFooterPage() {
  const [privacyUrl, setPrivacyUrl] = useState("/privacy");
  const [termsUrl, setTermsUrl] = useState("/terms");
  const [saved, setSaved] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Footer</h1>
        <p className={styles.subtitle}>Manage footer legal links.</p>
      </div>

      {saved && <div className={styles.successBanner} role="status">✓ Footer settings saved.</div>}

      <form className={styles.card} onSubmit={onSave}>
        <h2 className={styles.cardTitle}>Legal Links</h2>
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="f-privacy">Privacy Policy URL</label>
            <input id="f-privacy" type="text" className={styles.input} value={privacyUrl} onChange={e => setPrivacyUrl(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="f-terms">Terms &amp; Conditions URL</label>
            <input id="f-terms" type="text" className={styles.input} value={termsUrl} onChange={e => setTermsUrl(e.target.value)} />
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.btnSave}>Save</button>
          </div>
        </div>
      </form>
    </div>
  );
}
