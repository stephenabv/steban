"use client";

import { Field, Input, Switch, Textarea } from "@/components/ui/Field";
import { formLayout } from "@/components/ui/formLayout";
import { PROJECT_LIMITS } from "./ProjectFormModel";
import type { UseProjectForm } from "./useProjectForm";
import styles from "./ProjectFormFields.module.less";
import pageStyles from "../AdminPage.module.less";

interface Props {
  form: UseProjectForm;
  /** Prefix keeps ids unique when several forms exist on a page. */
  idPrefix: string;
}

/** Shared project fields for the create page and the edit dialog. */
export function ProjectFormFields({ form, idPrefix }: Props) {
  const { values, setField, setTitle, setSlug } = form;
  const id = (name: string) => `${idPrefix}-${name}`;
  const hasPreview = /^https?:\/\//.test(values.imageUrl.trim());

  return (
    <div className={styles.sections}>
      <fieldset className={styles.section}>
        <legend className={styles.legend}>Basics</legend>
        <div className={formLayout.grid}>
          <Field label="Title" id={id("title")} required>
            <Input
              type="text"
              value={values.title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Awesome Project"
            />
          </Field>
          <Field label="Slug" id={id("slug")} required hint={`Used in the URL: /projects/${values.slug || "my-awesome-project"}`}>
            <Input
              type="text"
              value={values.slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-awesome-project"
              spellCheck={false}
            />
          </Field>
          <Field
            label="Summary"
            id={id("summary")}
            className={formLayout.span2}
            hint="One line shown on project cards."
            count={{ value: values.summary.length, max: PROJECT_LIMITS.summary }}
          >
            <Input
              type="text"
              value={values.summary}
              onChange={(e) => setField("summary", e.target.value)}
              placeholder="One-line description shown on project cards"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className={styles.section}>
        <legend className={styles.legend}>Content</legend>
        <div className={formLayout.grid}>
          <Field
            label="Description"
            id={id("description")}
            className={formLayout.span2}
            count={{ value: values.description.length, max: PROJECT_LIMITS.description }}
          >
            <Textarea
              value={values.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Full project description, features, challenges…"
              rows={6}
            />
          </Field>
          <Field label="Key features" id={id("features")} hint="One feature per line — shown on the project detail page.">
            <Textarea
              value={values.features}
              onChange={(e) => setField("features", e.target.value)}
              placeholder={"Real-time collaboration\nOffline support\nRole-based access control"}
              rows={5}
            />
          </Field>
          <Field label="Tech stack" id={id("tech")} hint="Comma-separated list of technologies.">
            <Textarea
              value={values.techStack}
              onChange={(e) => setField("techStack", e.target.value)}
              placeholder="Next.js, TypeScript, PostgreSQL"
              rows={5}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className={styles.section}>
        <legend className={styles.legend}>Links &amp; media</legend>
        <div className={formLayout.grid}>
          <Field label="Live URL" id={id("live")} optional>
            <Input type="url" value={values.liveUrl} onChange={(e) => setField("liveUrl", e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Repository URL" id={id("repo")} optional>
            <Input
              type="url"
              value={values.repoUrl}
              onChange={(e) => setField("repoUrl", e.target.value)}
              placeholder="https://github.com/…"
            />
          </Field>
          <Field label="Cover image URL" id={id("image")} optional hint="Upload to Vercel Blob and paste the URL here.">
            <Input type="url" value={values.imageUrl} onChange={(e) => setField("imageUrl", e.target.value)} placeholder="https://…" />
          </Field>
          <div className={pageStyles.imagePreview} aria-hidden="true">
            {hasPreview ? (
              // Plain <img>: an arbitrary URL being typed shouldn't hit the image optimizer.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={values.imageUrl.trim()} alt="" />
            ) : (
              "Cover preview"
            )}
          </div>
          <div className={formLayout.span2}>
            <Switch
              id={id("featured")}
              checked={values.featured}
              onCheckedChange={(checked) => setField("featured", checked)}
              label="Feature on the home page"
              description="Featured projects appear in the home page carousel."
            />
          </div>
        </div>
      </fieldset>
    </div>
  );
}
