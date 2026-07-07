"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import styles from "@/features/admin/AdminPage.module.less";

export default function AdminAboutPage() {
  const toast = useToast();
  const [biography, setBiography] = useState("");

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    // TODO: save via AboutService when DB is wired up
    toast.success("About content saved.");
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>About</h1>
        <p className={styles.subtitle}>Edit biography, skills, experience, education, certifications, and awards.</p>
      </div>

      <form className={styles.card} onSubmit={onSave}>
        <h2 className={styles.cardTitle}>Biography</h2>
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ab-bio">Biography</label>
            <textarea
              id="ab-bio"
              className={styles.textarea}
              value={biography}
              onChange={e => setBiography(e.target.value)}
              rows={8}
              placeholder="Write a professional biography..."
            />
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.btnSave}>Save Biography</button>
          </div>
        </div>
      </form>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Skills, Experience, Education &amp; Certifications</h2>
        <p style={{ color: "var(--color-text-muted, #606075)", fontSize: "0.875rem" }}>
          Full skill, experience, and education management UI will be connected once the database is configured. Use the service layer at <code>server/services/AboutService.ts</code> to wire up CRUD operations.
        </p>
      </div>
    </div>
  );
}
