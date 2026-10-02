export interface ContactLinks {
  email: string;
  portfolioUrl: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

export interface SkillGroup {
  category: string;
  skills: readonly string[];
}

export interface ProfileExperience {
  company: string;
  role: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  description: string;
  technologies: readonly string[];
}

export interface ProfileProject {
  title: string;
  summary: string;
  description: string;
  technologies: readonly string[];
  liveUrl?: string;
}

export interface ProfileEducation {
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear?: number;
}

export interface ProfileCertification {
  name: string;
  issuer: string;
  issuedAt: Date;
}

/**
 * Read-only snapshot of the applicant, assembled from the portfolio's stored
 * content (hero, about, projects, contact info). Never hardcoded.
 */
export interface ApplicantProfile {
  readonly fullName: string;
  readonly title: string;
  readonly summary: string;
  readonly contact: Readonly<ContactLinks>;
  readonly skillGroups: readonly SkillGroup[];
  /** Newest first. */
  readonly experiences: readonly ProfileExperience[];
  readonly projects: readonly ProfileProject[];
  readonly education: readonly ProfileEducation[];
  readonly certifications: readonly ProfileCertification[];
}

/** Every technology the applicant can truthfully claim: skills plus experience and project tags. */
export function profileTechnologies(profile: ApplicantProfile): string[] {
  return [
    ...profile.skillGroups.flatMap((group) => group.skills),
    ...profile.experiences.flatMap((experience) => experience.technologies),
    ...profile.projects.flatMap((project) => project.technologies),
  ];
}
