import "server-only";
import { getAboutContent, getLegalDocument } from "@/lib/content/publicContent";
import { getProjectService, getSeoService } from "@/server/services";
import { IndexingPolicy } from "./IndexingPolicy";
import { ProjectSitemapProvider, type SitemapProject } from "./ProjectSitemapProvider";
import { SitemapService } from "./SitemapService";
import { StaticPageSitemapProvider } from "./StaticPageSitemapProvider";

const PROJECT_PAGE_SIZE = 100;
// The sitemap protocol caps a file at 50,000 URLs; this stays far below it.
const MAX_PROJECT_PAGES = 100;

async function loadAllProjects(): Promise<SitemapProject[] | null> {
  const projects: SitemapProject[] = [];
  for (let page = 1; page <= MAX_PROJECT_PAGES; page++) {
    const result = await getProjectService().getAll({ page, pageSize: PROJECT_PAGE_SIZE });
    if (!result.ok) {
      console.error("[sitemap] projects unavailable:", result.error.message);
      return projects.length > 0 ? projects : null;
    }
    projects.push(...result.value.items);
    if (page >= result.value.totalPages) break;
  }
  return projects;
}

async function loadIndexingPolicy(): Promise<IndexingPolicy | null> {
  const result = await getSeoService().getAll();
  if (result.ok) return IndexingPolicy.fromSeoEntries(result.value);
  console.error("[sitemap] SEO settings unavailable:", result.error.message);
  return null;
}

export function getDefaultSitemapService(): SitemapService {
  return new SitemapService(
    [
      new StaticPageSitemapProvider({
        aboutUpdatedAt: async () => (await getAboutContent())?.updatedAt ?? null,
        legalUpdatedAt: async (kind) => (await getLegalDocument(kind)).effectiveDate,
      }),
      new ProjectSitemapProvider(loadAllProjects),
    ],
    loadIndexingPolicy
  );
}
