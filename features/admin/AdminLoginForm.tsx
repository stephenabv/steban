"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/layout/Logo";
import styles from "./AdminLoginForm.module.less";

export function AdminLoginForm({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      // A 500 (e.g. missing server env vars) returns an HTML error page, not JSON —
      // parse defensively so we can surface the real status instead of a bogus network error.
      let data: { ok?: boolean; error?: string } = {};
      try {
        data = (await res.json()) as { ok?: boolean; error?: string };
      } catch {
        setError(`Server error (${res.status}). Check that SESSION_SECRET, ADMIN_USERNAME, and ADMIN_PASSWORD_HASH are set.`);
        return;
      }
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Invalid credentials.");
        return;
      }
      const raw = searchParams.get("callbackUrl") ?? "";
      const destination = raw.startsWith(basePath) ? raw : basePath;
      router.push(destination);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const [first, last] = siteConfig.name.split(" ");

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
            <Logo size={48} />
          </div>
          <p className={styles.logo}>
            {first} <span>{last}</span>
          </p>
          <p className={styles.subtitle}>Admin Dashboard</p>
        </div>

        <form className={styles.form} onSubmit={onSubmit} aria-label="Admin login">
          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          <div className={styles.field}>
            <label htmlFor="username" className={styles.label}>Username</label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              className={styles.input}
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className={styles.submit} disabled={loading} aria-busy={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <Link href="/" className={styles.backLink}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to site
        </Link>
      </div>
    </div>
  );
}
