"use client";

import { useState } from "react";
import { Field, Textarea } from "@/components/ui/Field";
import { PlaceholderEditor } from "@/features/admin/PlaceholderEditor";
import styles from "@/features/admin/AdminPage.module.less";

export default function AdminAboutPage() {
  const [biography, setBiography] = useState("");

  return (
    <PlaceholderEditor
      title="About"
      description="Biography, skills, experience, education, certifications and awards."
      sectionTitle="Biography"
      sectionDescription="Skills, experience, education and certification management will be added alongside the About repository (server/services/AboutService.ts)."
      saveLabel="Save biography"
    >
      <Field label="Biography" id="ab-bio" hint="Line breaks are preserved on the public page.">
        <Textarea
          value={biography}
          onChange={(e) => setBiography(e.target.value)}
          rows={10}
          placeholder="Write a professional biography…"
        />
      </Field>
      <p className={styles.muted} style={{ marginTop: "1rem" }}>
        {biography.trim() ? `${biography.trim().split(/\s+/).length} words` : "No biography yet."}
      </p>
    </PlaceholderEditor>
  );
}
