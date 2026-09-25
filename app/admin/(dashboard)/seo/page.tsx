"use client";

import { useState } from "react";
import { Field, Input, Select, Switch, Textarea } from "@/components/ui/Field";
import { formLayout } from "@/components/ui/formLayout";
import { PlaceholderEditor } from "@/features/admin/PlaceholderEditor";

const PAGE_KEYS = ["home", "projects", "about", "contact"];

/** Guidance hint that reacts to the recommended length window. */
function lengthHint(length: number, min: number, max: number): string {
  if (length === 0) return `Recommended: ${min}–${max} characters.`;
  if (length < min) return `${min - length} more characters recommended (${min}–${max}).`;
  if (length > max) return `${length - max} characters over the recommended ${max} — may be truncated in search results.`;
  return `Good length for search results (${min}–${max}).`;
}

export default function AdminSeoPage() {
  const [pageKey, setPageKey] = useState("home");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [noIndex, setNoIndex] = useState(false);

  return (
    <PlaceholderEditor
      title="SEO metadata"
      description="Page-level title, description and Open Graph data."
      sectionTitle="Page SEO"
      saveLabel="Save SEO"
    >
      <div className={formLayout.grid}>
        <Field label="Page" id="seo-page">
          <Select value={pageKey} onChange={(e) => setPageKey(e.target.value)}>
            {PAGE_KEYS.map((k) => (
              <option key={k} value={k}>
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </option>
            ))}
          </Select>
        </Field>
        <div />
        <Field
          label="Page title"
          id="seo-title"
          className={formLayout.span2}
          hint={lengthHint(title.length, 50, 60)}
          count={{ value: title.length, max: 60 }}
        >
          <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Page Title | Stephen Abueva" />
        </Field>
        <Field
          label="Meta description"
          id="seo-desc"
          className={formLayout.span2}
          hint={lengthHint(description.length, 120, 158)}
          count={{ value: description.length, max: 158 }}
        >
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Concise page description for search engines…"
          />
        </Field>
        <Field label="Keywords" id="seo-kw" hint="Comma-separated." className={formLayout.span2}>
          <Input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="software engineer, full-stack, Next.js"
          />
        </Field>
        <Field label="OG image URL" id="seo-og" hint="1200×630 recommended." className={formLayout.span2}>
          <Input type="url" value={ogImageUrl} onChange={(e) => setOgImageUrl(e.target.value)} placeholder="https://…" />
        </Field>
        <div className={formLayout.span2}>
          <Switch
            checked={noIndex}
            onCheckedChange={setNoIndex}
            label="Exclude from search engines (noindex)"
            description="Search engines will be asked not to index this page."
          />
        </div>
      </div>
    </PlaceholderEditor>
  );
}
