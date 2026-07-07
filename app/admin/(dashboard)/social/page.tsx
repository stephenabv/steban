"use client";

import { useState } from "react";
import { BackButton } from "@/features/admin/BackButton";
import { useToast } from "@/components/ui/ToastProvider";
import styles from "@/features/admin/AdminPage.module.less";

export default function AdminSocialPage() {
  const toast = useToast();
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [facebook, setFacebook] = useState("");

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    toast.success("Social links saved.");
  }

  return (
    <div className={styles.page}>
      <BackButton />
      <div className={styles.header}>
        <h1 className={styles.title}>Social Links</h1>
        <p className={styles.subtitle}>Manage social profile URLs shown in the footer and contact page.</p>
      </div>

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
