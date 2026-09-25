import type { Metadata } from "next";
import { getSeoService } from "@/server/services";
import { SEO_PAGE_KEYS } from "@/server/domain/entities";
import type { SeoMetadata } from "@/server/domain/entities";
import { pageSeoDefaults } from "@/config/seo";
import { SITE_URL } from "@/config/site";
import { SeoEditor } from "@/features/admin/content/SeoEditor";
import type { SeoPageEntry } from "@/features/admin/content/SeoEditor";
import { LoadError } from "@/features/admin/content/LoadError";

export const metadata: Metadata = { title: "SEO Metadata" };
export const dynamic = "force-dynamic";

const PATHS = { home: "/", projects: "/projects", about: "/about", contact: "/contact" } as const;

export default async function AdminSeoPage() {
  const result = await getSeoService().getAll();
  if (!result.ok) return <LoadError title="SEO metadata" />;
  const byPage = new Map<string, SeoMetadata>(result.value.map((s) => [s.pageKey, s]));

  const pages = Object.fromEntries(
    SEO_PAGE_KEYS.map((key) => {
      const saved = byPage.get(key);
      const entry: SeoPageEntry = {
        savedAt: saved?.updatedAt.toISOString() ?? null,
        defaults: { ...pageSeoDefaults[key], path: PATHS[key] },
        values: {
          pageKey: key,
          title: saved?.title ?? "",
          description: saved?.description ?? "",
          keywords: saved?.keywords.join(", ") ?? "",
          ogImageUrl: saved?.ogImageUrl ?? "",
          noIndex: saved?.noIndex ?? false,
        },
      };
      return [key, entry];
    })
  ) as Record<(typeof SEO_PAGE_KEYS)[number], SeoPageEntry>;

  return <SeoEditor pages={pages} siteUrl={SITE_URL} />;
}
