import type { SeoContent, SeoMetadata, UpdateSeoMetadataInput } from "@/server/domain/entities";
import type { Paginated } from "@/server/domain/types";
import { BaseRepository } from "./BaseRepository";

export abstract class SeoRepository extends BaseRepository<
  SeoMetadata,
  Omit<SeoMetadata, "id" | "updatedAt">,
  UpdateSeoMetadataInput
> {
  abstract findByPageKey(pageKey: string): Promise<SeoMetadata | null>;
  abstract findAll(): Promise<Paginated<SeoMetadata>>;
  /** Creates or replaces the metadata for one page. */
  abstract upsert(pageKey: string, content: SeoContent): Promise<SeoMetadata>;
}
