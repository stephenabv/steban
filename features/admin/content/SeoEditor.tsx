"use client";

import { Field, Input, Switch, Textarea } from "@/components/ui/Field";
import { formLayout } from "@/components/ui/formLayout";
import { cn } from "@/lib/cn";
import { saveSeoAction } from "../contentActions";
import { ContentEditor } from "./ContentEditor";
import { useContentForm } from "./useContentForm";
import styles from "./SeoEditor.module.less";

type PageKey = "home" | "projects" | "about" | "contact";

export interface SeoFormValues {
  pageKey: PageKey;
  title: string;
  description: string;
  /** Comma-separated in the form; split before saving. */
  keywords: string;
  ogImageUrl: string;
  noIndex: boolean;
}

export interface SeoPageEntry {
  values: SeoFormValues;
  savedAt: string | null;
  defaults: { title: string; description: string; path: string };
}

const PAGE_LABELS: Record<PageKey, string> = { home: "Home", projects: "Projects", about: "About", contact: "Contact" };

function lengthHint(length: number, min: number, max: number): string {
  if (length === 0) return `Empty uses the default. Recommended: ${min}–${max} characters.`;
  if (length < min) return `${min - length} more characters recommended (${min}–${max}).`;
  if (length > max) return `${length - max} over the recommended ${max} — may be truncated in search results.`;
  return `Good length for search results (${min}–${max}).`;
}

async function save(values: SeoFormValues) {
  return saveSeoAction({
    ...values,
    keywords: values.keywords.split(",").map((k) => k.trim()).filter(Boolean),
  });
}

export function SeoEditor({ pages, siteUrl }: { pages: Record<PageKey, SeoPageEntry>; siteUrl: string }) {
  const form = useContentForm(pages.home.values, pages.home.savedAt, save, "SEO saved.");
  const { values, patch, errors } = form;
  const current = pages[values.pageKey];

  function switchPage(key: PageKey) {
    if (key === values.pageKey) return;
    if (form.isDirty && !window.confirm(`Discard unsaved changes to the ${PAGE_LABELS[values.pageKey]} page?`)) return;
    form.reset(pages[key].values, pages[key].savedAt);
  }

  const previewTitle = values.title || current.defaults.title;
  const previewDescription = values.description || current.defaults.description;

  return (
    <ContentEditor
      title="SEO metadata"
      description="Search and social-sharing titles and descriptions for each page. Empty fields use the defaults shown."
      sectionTitle={`${PAGE_LABELS[values.pageKey]} page`}
      saveLabel="Save SEO"
      form={form}
      toolbar={
        <div className={styles.tabs} role="group" aria-label="Page">
          {(Object.keys(PAGE_LABELS) as PageKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className={cn(styles.tab, key === values.pageKey && styles.tabActive)}
              aria-pressed={key === values.pageKey}
              onClick={() => switchPage(key)}
            >
              {PAGE_LABELS[key]}
              {pages[key].savedAt && <span className={styles.customised} aria-label="(customised)" />}
            </button>
          ))}
        </div>
      }
    >
      <div className={formLayout.grid}>
        <Field
          label="Page title"
          id="seo-title"
          className={formLayout.span2}
          error={errors.title}
          hint={lengthHint(values.title.length, 50, 60)}
          count={{ value: values.title.length, max: 70 }}
        >
          <Input type="text" value={values.title} onChange={(e) => patch({ title: e.target.value })} placeholder={current.defaults.title} />
        </Field>
        <Field
          label="Meta description"
          id="seo-desc"
          className={formLayout.span2}
          error={errors.description}
          hint={lengthHint(values.description.length, 120, 158)}
          count={{ value: values.description.length, max: 200 }}
        >
          <Textarea
            rows={3}
            value={values.description}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder={current.defaults.description}
          />
        </Field>
        <Field label="Keywords" id="seo-kw" optional hint="Comma-separated." className={formLayout.span2} error={errors.keywords}>
          <Input
            type="text"
            value={values.keywords}
            onChange={(e) => patch({ keywords: e.target.value })}
            placeholder="software engineer, full-stack, Next.js"
          />
        </Field>
        <Field
          label="Social share image URL"
          id="seo-og"
          optional
          hint="1200×630 recommended. Empty uses the generated default image."
          className={formLayout.span2}
          error={errors.ogImageUrl}
        >
          <Input type="url" value={values.ogImageUrl} onChange={(e) => patch({ ogImageUrl: e.target.value })} placeholder="https://…" />
        </Field>
        <div className={formLayout.span2}>
          <Switch
            checked={values.noIndex}
            onCheckedChange={(noIndex) => patch({ noIndex })}
            label="Hide this page from search engines (noindex)"
            description="Search engines will be asked not to index this page."
          />
        </div>
      </div>

      <section className={styles.preview} aria-label="Search result preview">
        <p className={styles.previewLabel}>Search result preview</p>
        <p className={styles.previewUrl}>{`${siteUrl}${current.defaults.path === "/" ? "" : current.defaults.path}`}</p>
        <p className={styles.previewTitle}>{previewTitle}</p>
        <p className={styles.previewDescription}>{previewDescription}</p>
      </section>
    </ContentEditor>
  );
}
