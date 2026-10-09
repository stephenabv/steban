import { SearchQuery } from "@/lib/search/SearchQuery";
import type { AdminSearchGroup } from "@/lib/search/AdminSearchResult";
import type { AdminSearchContext, AdminSearchProvider } from "./AdminSearchProvider";

export interface AdminSearchOutcome {
  query: string;
  groups: AdminSearchGroup[];
  /** Labels of groups whose data could not be loaded. */
  unavailable: string[];
}

/**
 * Fans one query out to every provider in parallel. A provider that fails is
 * reported as unavailable instead of failing the whole search.
 */
export class AdminSearchService {
  constructor(
    private readonly providers: readonly AdminSearchProvider<unknown>[],
    private readonly onProviderError: (group: string, error: unknown) => void = () => {}
  ) {}

  /** Returns null when the input is not a searchable query. */
  async search(raw: unknown, ctx: AdminSearchContext): Promise<AdminSearchOutcome | null> {
    const query = SearchQuery.parse(raw);
    if (!query) return null;

    const settled = await Promise.allSettled(this.providers.map((p) => p.search(query, ctx)));
    const groups: AdminSearchGroup[] = [];
    const unavailable: string[] = [];

    settled.forEach((result, i) => {
      const provider = this.providers[i];
      if (result.status === "rejected") {
        this.onProviderError(provider.group, result.reason);
        unavailable.push(provider.label);
      } else if (result.value.length > 0) {
        groups.push({ id: provider.group, label: provider.label, hits: result.value });
      }
    });

    return { query: query.text, groups, unavailable };
  }
}
