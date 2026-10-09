import type { SearchField } from "@/lib/search/SearchQuery";
import type { Project } from "@/server/domain/entities";
import type { ProjectService } from "../../ProjectService";
import { AdminSearchProvider, type ProviderHit } from "../AdminSearchProvider";

/** Matches the same rows the admin projects table loads. */
const LOAD_LIMIT = 100;

export class ProjectSearchProvider extends AdminSearchProvider<Project> {
  readonly group = "projects" as const;
  readonly label = "Projects";

  constructor(private readonly projects: ProjectService) {
    super();
  }

  protected async load(): Promise<readonly Project[]> {
    return this.unwrap(await this.projects.getAll({ pageSize: LOAD_LIMIT })).items;
  }

  protected fields(p: Project): SearchField[] {
    return [
      { text: p.title, weight: 3 },
      { text: p.slug, weight: 2 },
      { text: p.technologies.join(" "), weight: 2 },
      { text: p.summary, weight: 1 },
    ];
  }

  protected toHit(p: Project): ProviderHit {
    return {
      id: p.id,
      title: p.title,
      subtitle: p.summary,
      badge: p.featured ? "Featured" : undefined,
      // Projects are edited in place on the list, so filter it to this one.
      path: `/projects?q=${encodeURIComponent(p.slug)}`,
    };
  }

  protected recency(p: Project): number {
    return p.publishedAt.getTime();
  }
}
