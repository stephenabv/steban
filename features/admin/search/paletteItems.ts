import type { IconName } from "@/components/icons/Icon";
import { SearchQuery } from "@/lib/search/SearchQuery";
import type { AdminSearchGroup, AdminSearchGroupId } from "@/lib/search/AdminSearchResult";
import { adminNavigation } from "../adminNavigation";

/** One selectable row in the command palette. */
export interface PaletteItem {
  key: string;
  title: string;
  subtitle?: string;
  badge?: string;
  icon: IconName;
  href: string;
}

export interface PaletteSection {
  id: string;
  label: string;
  items: PaletteItem[];
}

const RECORD_ICONS: Record<AdminSearchGroupId, IconName> = {
  projects: "layers",
  messages: "inbox",
  coverLetters: "pencil",
  legal: "shield",
};

const PAGE_RESULT_LIMIT = 5;

/**
 * Builds palette sections: admin pages and quick actions are matched in the
 * browser, records come from the server search.
 */
export class PaletteCatalog {
  private readonly pages: PaletteItem[];
  private readonly actions: PaletteItem[];

  constructor(basePath: string) {
    this.pages = adminNavigation.flatMap((group) =>
      group.items.map((item) => ({
        key: `page:${item.path || "/"}`,
        title: item.label,
        subtitle: item.description,
        icon: item.icon,
        href: `${basePath}${item.path}`,
      }))
    );
    this.actions = [
      {
        key: "action:new-project",
        title: "New project",
        subtitle: "Add a project to your portfolio",
        icon: "plus",
        href: `${basePath}/projects/new`,
      },
      {
        key: "action:new-letter",
        title: "New cover letter",
        subtitle: "Write a letter for a job application",
        icon: "plus",
        href: `${basePath}/cover-letters/new`,
      },
    ];
  }

  /** Sections for the current input; `records` are the server groups for the same query. */
  sections(input: string, records: readonly AdminSearchGroup[]): PaletteSection[] {
    const query = SearchQuery.parse(input);
    if (!query) {
      return [
        { id: "actions", label: "Quick actions", items: this.actions },
        { id: "pages", label: "Go to", items: this.pages },
      ];
    }

    const local = [...this.actions, ...this.pages]
      .map((item) => ({
        item,
        score: query.score([
          { text: item.title, weight: 3 },
          { text: item.subtitle, weight: 1 },
        ]),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, PAGE_RESULT_LIMIT)
      .map(({ item }) => item);

    const sections: PaletteSection[] = local.length
      ? [{ id: "pages", label: "Pages and actions", items: local }]
      : [];
    for (const group of records) {
      sections.push({
        id: group.id,
        label: group.label,
        items: group.hits.map((hit) => ({
          key: `${group.id}:${hit.id}`,
          title: hit.title,
          subtitle: hit.subtitle,
          badge: hit.badge,
          icon: RECORD_ICONS[group.id],
          href: hit.href,
        })),
      });
    }
    return sections;
  }
}
