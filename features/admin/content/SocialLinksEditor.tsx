"use client";

import { Field, Input } from "@/components/ui/Field";
import { formLayout } from "@/components/ui/formLayout";
import { saveSocialLinksAction } from "../contentActions";
import { ContentEditor } from "./ContentEditor";
import { useContentForm } from "./useContentForm";

export interface SocialLinksFormValues {
  githubUrl: string;
  linkedinUrl: string;
  facebookUrl: string;
}

const FIELDS = [
  { key: "githubUrl", label: "GitHub", placeholder: "https://github.com/…" },
  { key: "linkedinUrl", label: "LinkedIn", placeholder: "https://linkedin.com/in/…" },
  { key: "facebookUrl", label: "Facebook", placeholder: "https://facebook.com/…" },
] as const;

export function SocialLinksEditor({ initial, savedAt }: { initial: SocialLinksFormValues; savedAt: string | null }) {
  const form = useContentForm(initial, savedAt, saveSocialLinksAction, "Social links saved.");

  return (
    <ContentEditor
      title="Social links"
      description="Profiles linked from the footer, the Contact page and search-engine profile data."
      sectionTitle="Social profiles"
      sectionDescription="Leave a field empty to hide that profile."
      saveLabel="Save links"
      form={form}
    >
      <div className={formLayout.grid}>
        {FIELDS.map(({ key, label, placeholder }) => (
          <Field key={key} label={label} id={`s-${key}`} optional className={formLayout.span2} error={form.errors[key]}>
            <Input
              type="url"
              value={form.values[key]}
              onChange={(e) => form.patch({ [key]: e.target.value } as Partial<SocialLinksFormValues>)}
              placeholder={placeholder}
            />
          </Field>
        ))}
      </div>
    </ContentEditor>
  );
}
