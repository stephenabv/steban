"use client";

import { Field, Input } from "@/components/ui/Field";
import { formLayout } from "@/components/ui/formLayout";
import { saveFooterAction } from "../contentActions";
import { ContentEditor } from "./ContentEditor";
import { useContentForm } from "./useContentForm";

export interface FooterFormValues {
  privacyUrl: string;
  termsUrl: string;
}

export function FooterEditor({ initial, savedAt }: { initial: FooterFormValues; savedAt: string | null }) {
  const form = useContentForm(initial, savedAt, saveFooterAction, "Footer saved.");

  return (
    <ContentEditor
      title="Footer"
      description="Legal links shown at the bottom of every public page."
      sectionTitle="Legal links"
      sectionDescription="Use a site path (e.g. /privacy) for the built-in pages, or a full https:// URL for an external policy."
      saveLabel="Save footer"
      form={form}
    >
      <div className={formLayout.grid}>
        <Field label="Privacy policy link" id="f-privacy" required error={form.errors.privacyUrl}>
          <Input type="text" value={form.values.privacyUrl} onChange={(e) => form.patch({ privacyUrl: e.target.value })} />
        </Field>
        <Field label="Terms & conditions link" id="f-terms" required error={form.errors.termsUrl}>
          <Input type="text" value={form.values.termsUrl} onChange={(e) => form.patch({ termsUrl: e.target.value })} />
        </Field>
      </div>
    </ContentEditor>
  );
}
