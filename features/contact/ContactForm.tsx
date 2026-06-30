"use client";

import { useState } from "react";
import { contactFormSchema } from "@/server/security/validation";
import type { ContactFormData } from "@/server/security/validation";
import styles from "./ContactForm.module.less";

type FieldErrors = Partial<Record<keyof ContactFormData, string>>;

const INITIAL: ContactFormData = { name: "", email: "", subject: "", message: "" };

export function ContactForm() {
  const [values, setValues] = useState<ContactFormData>(INITIAL);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);

    const parsed = contactFormSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ContactFormData;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const { error } = (await res.json()) as { error: string };
        setGlobalError(error ?? "Something went wrong. Please try again.");
        return;
      }
      setSuccess(true);
      setValues(INITIAL);
    } catch {
      setGlobalError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className={styles.successMsg} role="alert">
        <div className={styles.icon} aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h3>Message Sent!</h3>
        <p>Thank you for reaching out. I&apos;ll get back to you as soon as possible.</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate aria-label="Contact form">
      {globalError && (
        <div className={styles.globalError} role="alert">
          {globalError}
        </div>
      )}

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">
            Name <span className={styles.required} aria-label="required">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            aria-required="true"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            value={values.name}
            onChange={onChange}
            className={styles.input}
            placeholder="Your name"
          />
          {errors.name && (
            <span id="name-error" className={styles.error} role="alert">{errors.name}</span>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            Email <span className={styles.required} aria-label="required">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            value={values.email}
            onChange={onChange}
            className={styles.input}
            placeholder="your@email.com"
          />
          {errors.email && (
            <span id="email-error" className={styles.error} role="alert">{errors.email}</span>
          )}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="subject">
          Subject <span className={styles.required} aria-label="required">*</span>
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          aria-required="true"
          aria-invalid={!!errors.subject}
          aria-describedby={errors.subject ? "subject-error" : undefined}
          value={values.subject}
          onChange={onChange}
          className={styles.input}
          placeholder="What's this about?"
        />
        {errors.subject && (
          <span id="subject-error" className={styles.error} role="alert">{errors.subject}</span>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="message">
          Message <span className={styles.required} aria-label="required">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          aria-required="true"
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
          value={values.message}
          onChange={onChange}
          className={styles.textarea}
          placeholder="Your message..."
          rows={6}
        />
        {errors.message && (
          <span id="message-error" className={styles.error} role="alert">{errors.message}</span>
        )}
      </div>

      <button type="submit" className={styles.submit} disabled={loading} aria-busy={loading}>
        {loading ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
