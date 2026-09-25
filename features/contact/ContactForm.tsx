"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { contactFormSchema } from "@/server/security/validation";
import type { ContactFormData } from "@/server/security/validation";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { formLayout } from "@/components/ui/formLayout";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons/Icon";
import { EASE_OUT } from "@/lib/motion";
import styles from "./ContactForm.module.less";

type FieldErrors = Partial<Record<keyof ContactFormData, string>>;

const INITIAL: ContactFormData = { name: "", email: "", subject: "", message: "" };
const MESSAGE_MAX = 5000;
const FIELD_ORDER: (keyof ContactFormData)[] = ["name", "email", "subject", "message"];

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<ContactFormData>(INITIAL);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);

    const parsed = contactFormSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ContactFormData;
        fieldErrors[key] ??= issue.message;
      }
      setErrors(fieldErrors);
      // Move focus to the first invalid field so keyboard and SR users land on it.
      const firstInvalid = FIELD_ORDER.find((k) => fieldErrors[k]);
      if (firstInvalid) formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
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
        const { error } = (await res.json().catch(() => ({}))) as { error?: string };
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

  return (
    <div className={styles.card}>
      <AnimatePresence mode="wait" initial={false}>
        {success ? (
          <motion.div
            key="success"
            className={styles.success}
            role="status"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } }}
            exit={{ opacity: 0 }}
          >
            <span className={styles.successIcon} aria-hidden="true">
              <Icon name="check" size={28} strokeWidth={2.5} />
            </span>
            <h2 className={styles.successTitle}>Message sent!</h2>
            <p>Thank you for reaching out. I&apos;ll get back to you as soon as possible.</p>
            <Button variant="secondary" icon="mail" onClick={() => setSuccess(false)}>
              Send another message
            </Button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            ref={formRef}
            className={styles.form}
            onSubmit={onSubmit}
            noValidate
            aria-labelledby="contact-form-heading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div>
              <h2 id="contact-form-heading" className={styles.heading}>
                Send a message
              </h2>
              <p className={styles.subheading}>All fields are required.</p>
            </div>

            {globalError && <Alert tone="danger">{globalError}</Alert>}

            <div className={formLayout.grid}>
              <Field label="Name" required error={errors.name}>
                <Input
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={values.name}
                  onChange={onChange}
                  placeholder="Your name"
                />
              </Field>

              <Field label="Email" required error={errors.email}>
                <Input
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={values.email}
                  onChange={onChange}
                  placeholder="you@company.com"
                />
              </Field>

              <Field label="Subject" required error={errors.subject} className={formLayout.span2}>
                <Input
                  name="subject"
                  type="text"
                  value={values.subject}
                  onChange={onChange}
                  placeholder="What's this about?"
                />
              </Field>

              <Field
                label="Message"
                required
                error={errors.message}
                count={{ value: values.message.length, max: MESSAGE_MAX }}
                className={formLayout.span2}
              >
                <Textarea
                  name="message"
                  value={values.message}
                  onChange={onChange}
                  placeholder="Tell me a little about your project, timeline, or question…"
                  rows={6}
                />
              </Field>
            </div>

            <Button type="submit" size="lg" iconRight="arrow-right" loading={loading} loadingText="Sending…" fullWidth>
              Send message
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
