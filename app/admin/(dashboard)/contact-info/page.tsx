"use client";

import { useState } from "react";
import { Field, Input } from "@/components/ui/Field";
import { formLayout } from "@/components/ui/formLayout";
import { PlaceholderEditor } from "@/features/admin/PlaceholderEditor";

export default function AdminContactInfoPage() {
  const [email, setEmail] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [facebook, setFacebook] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");

  return (
    <PlaceholderEditor
      title="Contact information"
      description="Contact details and profile links shown on the Contact page."
      sectionTitle="Contact details"
    >
      <div className={formLayout.grid}>
        <Field label="Email address" id="ci-email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Resume URL" id="ci-resume">
          <Input type="text" value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} placeholder="/resume.pdf or https://…" />
        </Field>
        <Field label="GitHub URL" id="ci-github" className={formLayout.span2}>
          <Input type="url" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/…" />
        </Field>
        <Field label="LinkedIn URL" id="ci-linkedin">
          <Input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/…" />
        </Field>
        <Field label="Facebook URL" id="ci-facebook">
          <Input type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/…" />
        </Field>
      </div>
    </PlaceholderEditor>
  );
}
