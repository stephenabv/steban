"use client";

import { Field, Input } from "@/components/ui/Field";
import { saveContactEmailAction } from "../contentActions";
import { ContentEditor } from "./ContentEditor";
import { useContentForm } from "./useContentForm";

export function ContactEmailEditor({ initial, savedAt }: { initial: { email: string }; savedAt: string | null }) {
  const form = useContentForm(initial, savedAt, saveContactEmailAction, "Contact email saved.");

  return (
    <ContentEditor
      title="Contact information"
      description="The email address shown on the Contact page, the footer and the “Email me” buttons."
      sectionTitle="Contact details"
      sectionDescription="Social profile links are managed under Social Links."
      form={form}
    >
      <Field
        label="Email address"
        id="ci-email"
        error={form.errors.email}
        hint="Leave empty to hide email links across the site. The contact form keeps working either way."
      >
        <Input
          type="email"
          autoComplete="email"
          value={form.values.email}
          onChange={(e) => form.patch({ email: e.target.value })}
          placeholder="you@example.com"
        />
      </Field>
    </ContentEditor>
  );
}
