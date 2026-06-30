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
