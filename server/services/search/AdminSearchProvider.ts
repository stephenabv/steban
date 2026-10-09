import type { SearchField, SearchQuery } from "@/lib/search/SearchQuery";
import type { AdminSearchGroupId, AdminSearchHit } from "@/lib/search/AdminSearchResult";
import type { Result } from "@/server/domain/types";

export interface AdminSearchContext {
  ownerId: string;
  /** Admin base path, e.g. "/admin". */
  basePath: string;
}

/** A hit before the base path is applied; `path` is relative to the admin root. */
export type ProviderHit = Omit<AdminSearchHit, "href"> & { path: string };

/**
 * Template method for one searchable admin collection: subclasses say how to
 * load records, which fields to match and how a record becomes a hit; the
 * base class owns scoring, ranking, limiting and URL building.
 */
export abstract class AdminSearchProvider<T> {
  abstract readonly group: AdminSearchGroupId;
  abstract readonly label: string;

  constructor(protected readonly limit = 5) {}

  async search(query: SearchQuery, ctx: AdminSearchContext): Promise<AdminSearchHit[]> {
    const records = await this.load(ctx);
    return records
      .map((record) => ({ record, score: query.score(this.fields(record)) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || this.recency(b.record) - this.recency(a.record))
      .slice(0, this.limit)
      .map(({ record }) => {
        const { path, ...hit } = this.toHit(record);
        return { ...hit, href: `${ctx.basePath}${path}` };
      });
  }

  protected abstract load(ctx: AdminSearchContext): Promise<readonly T[]>;
  protected abstract fields(record: T): SearchField[];
  protected abstract toHit(record: T): ProviderHit;

  /** Orders equally relevant records, newest first (epoch milliseconds). */
  protected abstract recency(record: T): number;

  /** Unwraps a service Result, so a failed load rejects and is reported per group. */
  protected unwrap<V>(result: Result<V>): V {
    if (!result.ok) throw result.error;
    return result.value;
  }
}
