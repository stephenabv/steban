"use client";

import { useState } from "react";
import { Field, Input } from "@/components/ui/Field";
import { formLayout } from "@/components/ui/formLayout";
import { PlaceholderEditor } from "@/features/admin/PlaceholderEditor";

export default function AdminFooterPage() {
  const [privacyUrl, setPrivacyUrl] = useState("/privacy");
  const [termsUrl, setTermsUrl] = useState("/terms");

  return (
    <PlaceholderEditor
      title="Footer"
      description="Legal links shown at the bottom of every public page."
      sectionTitle="Legal links"
      saveLabel="Save footer"
    >
      <div className={formLayout.grid}>
        <Field label="Privacy policy URL" id="f-privacy">
          <Input type="text" value={privacyUrl} onChange={(e) => setPrivacyUrl(e.target.value)} />
        </Field>
        <Field label="Terms & conditions URL" id="f-terms">
          <Input type="text" value={termsUrl} onChange={(e) => setTermsUrl(e.target.value)} />
        </Field>
      </div>
    </PlaceholderEditor>
  );
}
