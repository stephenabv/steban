import type { About, Hero, Project } from "@/server/domain/entities";

/** Raw portfolio content the profile is assembled from. */
export interface ProfileSourceData {
  hero: Pick<Hero, "name" | "title" | "introduction"> | null;
  about: Pick<About, "biography" | "skills" | "experience" | "education" | "certifications"> | null;
  projects: readonly Project[];
  contact: { email: string; githubUrl?: string; linkedinUrl?: string };
  portfolioUrl: string;
}

/** Where "me" data comes from. The production source reads the portfolio's own store. */
export abstract class ProfileDataSource {
  abstract load(): Promise<ProfileSourceData>;
}
