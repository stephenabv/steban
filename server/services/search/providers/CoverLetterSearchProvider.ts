import type { SearchField } from "@/lib/search/SearchQuery";
import type { CoverLetterSummary } from "@/server/repositories/coverLetter/CoverLetterRepository";
import type { CoverLetterService } from "../../coverLetter/CoverLetterService";
import {
  AdminSearchProvider,
  type AdminSearchContext,
  type ProviderHit,
} from "../AdminSearchProvider";

export class CoverLetterSearchProvider extends AdminSearchProvider<CoverLetterSummary> {
  readonly group = "coverLetters" as const;
  readonly label = "Cover letters";

  constructor(private readonly letters: CoverLetterService) {
    super();
  }

  protected async load(ctx: AdminSearchContext): Promise<readonly CoverLetterSummary[]> {
    return this.unwrap(await this.letters.list(ctx.ownerId));
  }

  protected fields(l: CoverLetterSummary): SearchField[] {
    return [
      { text: l.companyName, weight: 3 },
      { text: l.positionTitle, weight: 2 },
    ];
  }

  protected toHit(l: CoverLetterSummary): ProviderHit {
    return {
      id: l.id,
      title: l.companyName,
      subtitle: l.positionTitle,
      badge: l.status === "draft" ? "Draft" : "Final",
      path: `/cover-letters/${encodeURIComponent(l.id)}`,
    };
  }

  protected recency(l: CoverLetterSummary): number {
    return l.updatedAt.getTime();
  }
}
