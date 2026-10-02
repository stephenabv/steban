import "server-only";
import type { Result } from "@/server/domain/types";
import { getAboutService, getHeroService, getProjectService } from "@/server/services";
import { ProfileDataSource } from "@/server/services/coverLetter/ProfileDataSource";
import type { ProfileSourceData } from "@/server/services/coverLetter/ProfileDataSource";
import { getPublicContact } from "@/lib/content/publicContent";
import { SITE_URL } from "@/config/site";

/** Projects are few; this bound only guards against an unexpectedly large table. */
const MAX_PROJECTS = 100;

const unwrap = <T>(label: string, result: Result<T>): T => {
  if (!result.ok) throw new Error(`Could not load ${label}.`);
  return result.value;
};

/**
 * Reads "me" data from the same services the public site renders, so the
 * letter always matches the portfolio. Contact links use the public site's
 * read model, including its fallback before contact info is first saved.
 */
export class PortfolioProfileDataSource extends ProfileDataSource {
  async load(): Promise<ProfileSourceData> {
    const [hero, about, projects, contact] = await Promise.all([
      getHeroService().getHero(),
      getAboutService().getAbout(),
      getProjectService().getAll({ page: 1, pageSize: MAX_PROJECTS, order: "featuredFirst" }),
      getPublicContact(),
    ]);
    const profileUrl = (platform: string) =>
      contact.profiles.find((profile) => profile.platform === platform)?.url;

    return {
      hero: unwrap("hero", hero),
      about: unwrap("about", about),
      projects: unwrap("projects", projects).items,
      contact: {
        email: contact.email,
        githubUrl: profileUrl("github"),
        linkedinUrl: profileUrl("linkedin"),
      },
      portfolioUrl: SITE_URL,
    };
  }
}
