"use client";

import { useState } from "react";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { formLayout } from "@/components/ui/formLayout";
import { PlaceholderEditor } from "@/features/admin/PlaceholderEditor";
import styles from "@/features/admin/AdminPage.module.less";

export default function AdminHeroPage() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const hasPreview = /^https?:\/\//.test(photoUrl.trim());

  return (
    <PlaceholderEditor
      title="Hero section"
      description="Your name, title, introduction and photo at the top of the home page."
      sectionTitle="Hero content"
    >
      <div className={formLayout.grid}>
        <Field label="Display name" id="h-name">
          <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Stephen Abueva" />
        </Field>
        <Field label="Professional title" id="h-title">
          <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Computer Engineer" />
        </Field>
        <Field label="Introduction" id="h-intro" className={formLayout.span2}>
          <Textarea
            value={introduction}
            onChange={(e) => setIntroduction(e.target.value)}
            placeholder="Short professional introduction…"
            rows={4}
          />
        </Field>
        <Field label="Profile photo URL" id="h-photo" hint="Upload to Vercel Blob and paste the URL here.">
          <Input type="url" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://…" />
        </Field>
        <div className={styles.imagePreview} aria-hidden="true">
          {hasPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl.trim()} alt="" />
          ) : (
            "Photo preview"
          )}
        </div>
        <Field label="Resume URL" id="h-resume" className={formLayout.span2}>
          <Input type="text" value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} placeholder="/resume.pdf or https://…" />
        </Field>
      </div>
    </PlaceholderEditor>
  );
}
