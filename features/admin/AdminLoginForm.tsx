"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/layout/Logo";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Icon } from "@/components/icons/Icon";
import styles from "./AdminLoginForm.module.less";

export function AdminLoginForm({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  return (
    <main id="main-content" className={styles.page} tabIndex={-1}>
      <div className={styles.backdrop} aria-hidden="true" />
      <div className={styles.card}>
        <div className={styles.header}>
          <Logo size={48} decorative />
          <h1 className={styles.title}>Sign in</h1>
          <p className={styles.subtitle}>{siteConfig.name} · Admin dashboard</p>
        </div>

        <form className={styles.form} onSubmit={onSubmit} aria-label="Admin login">
          {error && <Alert tone="danger">{error}</Alert>}

          <Field label="Username" id="username">
            <Input
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </Field>

          <Field label="Password" id="password">
            <div className={styles.passwordWrap}>
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className={styles.reveal}
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                <Icon name={showPassword ? "eye-off" : "eye"} size={16} />
              </button>
            </div>
          </Field>

          <Button type="submit" size="lg" fullWidth loading={loading} loadingText="Signing in…">
            Sign in
          </Button>
        </form>

        <Button href="/" variant="ghost" size="sm" icon="arrow-left" className={styles.backLink}>
          Back to site
        </Button>
      </div>
    </main>
  );
}
