"use client";

import type { ReactNode } from "react";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { formLayout } from "@/components/ui/formLayout";
import { saveHeroAction } from "../contentActions";
import { ContentEditor } from "./ContentEditor";
import { useContentForm } from "./useContentForm";

export interface HeroFormValues {
  name: string;
  title: string;
  introduction: string;
  photoAlt: string;
}

interface Props {
  initial: HeroFormValues;
  savedAt: string | null;
  /** Profile photo upload card; the photo is a file, saved independently of the text. */
  photoManager: ReactNode;
}

export function HeroEditor({ initial, savedAt, photoManager }: Props) {
  const form = useContentForm(initial, savedAt, saveHeroAction, "Hero saved — the home page is updated.");
  const { values, patch, errors } = form;

  return (
    <ContentEditor
      title="Hero section"
      description="Your name, title, introduction and photo at the top of the home page."
      sectionTitle="Hero content"
      beforeForm={photoManager}
      form={form}
    >
      <div className={formLayout.grid}>
        <Field label="Display name" id="h-name" required error={errors.name}>
          <Input type="text" value={values.name} onChange={(e) => patch({ name: e.target.value })} />
        </Field>
        <Field label="Professional title" id="h-title" required error={errors.title}>
          <Input type="text" value={values.title} onChange={(e) => patch({ title: e.target.value })} />
        </Field>
        <Field
          label="Introduction"
          id="h-intro"
          className={formLayout.span2}
          error={errors.introduction}
          hint="Leave empty to use the default introduction."
          count={{ value: values.introduction.length, max: 600 }}
        >
          <Textarea
            value={values.introduction}
            onChange={(e) => patch({ introduction: e.target.value })}
            placeholder="Short professional introduction…"
            rows={4}
          />
        </Field>
        <Field
          label="Photo description (alt text)"
          id="h-alt"
          optional
          className={formLayout.span2}
          error={errors.photoAlt}
          hint="Describes the profile photo for screen readers, e.g. “Stephen smiling in front of a whiteboard”."
        >
          <Input type="text" value={values.photoAlt} onChange={(e) => patch({ photoAlt: e.target.value })} />
        </Field>
      </div>
    </ContentEditor>
  );
}
