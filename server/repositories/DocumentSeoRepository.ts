import type { SeoContent, SeoMetadata, UpdateSeoMetadataInput } from "@/server/domain/entities";
import type { Paginated } from "@/server/domain/types";
import { SeoRepository } from "./SeoRepository";
import type { DocumentStore } from "./document/DocumentStore";

type StoredEntry = SeoContent & { updatedAt: string };
type StoredSeo = Record<string, StoredEntry>;

const KEY = "seo";

/** All pages' metadata in one document, keyed by page; the page key doubles as the id. */
export class DocumentSeoRepository extends SeoRepository {
  constructor(private readonly store: DocumentStore) {
    super();
  }

  private async readAll(): Promise<StoredSeo> {
    return (await this.store.read<StoredSeo>(KEY))?.data ?? {};
  }

  private toEntity(pageKey: string, entry: StoredEntry): SeoMetadata {
    const { updatedAt, ...content } = entry;
    return { id: pageKey, pageKey, ...content, updatedAt: new Date(updatedAt) };
  }

  async findByPageKey(pageKey: string): Promise<SeoMetadata | null> {
    const entry = (await this.readAll())[pageKey];
    return entry ? this.toEntity(pageKey, entry) : null;
  }

  async findById(id: string): Promise<SeoMetadata | null> {
    return this.findByPageKey(id);
  }

  async findAll(): Promise<Paginated<SeoMetadata>> {
    const items = Object.entries(await this.readAll()).map(([k, v]) => this.toEntity(k, v));
    return this.paginate(items, items.length, { page: 1, pageSize: Math.max(items.length, 1) });
  }

  async upsert(pageKey: string, content: SeoContent): Promise<SeoMetadata> {
    const all = await this.readAll();
    const entry: StoredEntry = { ...content, updatedAt: new Date().toISOString() };
    await this.store.write<StoredSeo>(KEY, { ...all, [pageKey]: entry });
    return this.toEntity(pageKey, entry);
  }

  async create(input: Omit<SeoMetadata, "id" | "updatedAt">): Promise<SeoMetadata> {
    const { pageKey, ...content } = input;
    return this.upsert(pageKey, content);
  }

  async update(id: string, input: UpdateSeoMetadataInput): Promise<SeoMetadata | null> {
    const existing = await this.findByPageKey(id);
    if (!existing) return null;
    const { id: _id, pageKey, updatedAt: _updatedAt, ...content } = existing;
    return this.upsert(pageKey, { ...content, ...input });
  }

  async delete(id: string): Promise<boolean> {
    const all = await this.readAll();
    if (!(id in all)) return false;
    const { [id]: _removed, ...rest } = all;
    await this.store.write<StoredSeo>(KEY, rest);
    return true;
  }
}
