"use client";

import { useState } from "react";
import { Field, Input } from "@/components/ui/Field";
import { formLayout } from "@/components/ui/formLayout";
import { PlaceholderEditor } from "@/features/admin/PlaceholderEditor";

export default function AdminSocialPage() {
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [facebook, setFacebook] = useState("");

  return (
    <PlaceholderEditor
      title="Social links"
      description="Profile URLs shown in the footer and on the contact page."
      sectionTitle="Social profiles"
      saveLabel="Save links"
    >
      <div className={formLayout.grid}>
        <Field label="GitHub" id="s-github" className={formLayout.span2}>
          <Input type="url" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/…" />
        </Field>
        <Field label="LinkedIn" id="s-linkedin">
          <Input type="url" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/…" />
        </Field>
        <Field label="Facebook" id="s-facebook">
          <Input type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/…" />
        </Field>
      </div>
    </PlaceholderEditor>
  );
}
