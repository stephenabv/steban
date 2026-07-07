"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import styles from "@/features/admin/AdminPage.module.less";

export default function AdminFooterPage() {
  const toast = useToast();
  const [privacyUrl, setPrivacyUrl] = useState("/privacy");
  const [termsUrl, setTermsUrl] = useState("/terms");

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Footer settings saved.");
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Footer</h1>
        <p className={styles.subtitle}>Manage footer legal links.</p>
      </div>

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
