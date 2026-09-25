export interface SeoMetadata {
  id: string;
  pageKey: string;
  title: string;
  description: string;
  keywords: string[];
  ogImageUrl?: string;
  noIndex: boolean;
  updatedAt: Date;
}

export type UpdateSeoMetadataInput = Partial<Omit<SeoMetadata, "id" | "pageKey" | "updatedAt">>;

/** Pages whose metadata is editable from the admin. */
export const SEO_PAGE_KEYS = ["home", "projects", "about", "contact"] as const;
export type SeoPageKey = (typeof SEO_PAGE_KEYS)[number];

/** Editable SEO fields for one page. */
export type SeoContent = Omit<SeoMetadata, "id" | "pageKey" | "updatedAt">;
