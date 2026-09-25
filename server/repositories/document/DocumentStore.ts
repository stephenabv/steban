/**
 * Keyed JSON document storage for single-record site content (hero, about,
 * SEO, footer). Repositories compose a store instead of each owning a table,
 * so adding a content type needs no new schema.
 */
export interface StoredDocument<T> {
  data: T;
  updatedAt: Date;
}

/** Keys are code-defined constants; the pattern also keeps file paths safe. */
export const DOCUMENT_KEY_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;

export abstract class DocumentStore {
  abstract read<T>(key: string): Promise<StoredDocument<T> | null>;
  /** Creates or replaces the document atomically. */
  abstract write<T>(key: string, data: T): Promise<StoredDocument<T>>;

  protected assertKey(key: string): void {
    if (!DOCUMENT_KEY_PATTERN.test(key)) {
      throw new Error(`Invalid document key: ${key}`);
    }
  }
}
