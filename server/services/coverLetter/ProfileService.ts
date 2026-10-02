import type { ApplicantProfile, SkillGroup } from "@/server/domain/coverLetter";
import { CoverLetterError } from "@/server/domain/coverLetter";
import type { Skill } from "@/server/domain/entities";
import type { ProfileDataSource, ProfileSourceData } from "./ProfileDataSource";

const optional = (value: string | undefined): string | undefined => value?.trim() || undefined;

/** Assembles the read-only ApplicantProfile from portfolio content. */
export class ProfileService {
  constructor(private readonly source: ProfileDataSource) {}

  async getProfile(): Promise<ApplicantProfile> {
    const data = await this.source.load();
    const fullName = data.hero?.name.trim();
    if (!fullName) {
      throw new CoverLetterError("Add your name in Hero before generating a cover letter.");
    }
    return Object.freeze(this.assemble(fullName, data));
  }

  private assemble(fullName: string, data: ProfileSourceData): ApplicantProfile {
    const about = data.about;
    return {
      fullName,
      title: data.hero?.title.trim() ?? "",
      summary: about?.biography.trim() || data.hero?.introduction.trim() || "",
      contact: {
        email: data.contact.email.trim(),
        portfolioUrl: data.portfolioUrl,
        githubUrl: optional(data.contact.githubUrl),
        linkedinUrl: optional(data.contact.linkedinUrl),
      },
      skillGroups: this.groupSkills(about?.skills ?? []),
      experiences: (about?.experience ?? [])
        .map((experience) => ({
          company: experience.company,
          role: experience.role,
          startDate: experience.startDate,
          endDate: experience.endDate,
          current: experience.current,
          description: experience.description,
          technologies: experience.technologies,
        }))
        .sort(
          (a, b) =>
            Number(b.current) - Number(a.current) || b.startDate.getTime() - a.startDate.getTime()
        ),
      projects: data.projects.map((project) => ({
        title: project.title,
        summary: project.summary,
        description: project.description,
        technologies: project.technologies,
        liveUrl: optional(project.liveUrl),
      })),
      education: (about?.education ?? []).map(
        ({ institution, degree, field, startYear, endYear }) => ({
          institution,
          degree,
          field,
          startYear,
          endYear,
        })
      ),
      certifications: (about?.certifications ?? []).map(({ name, issuer, issuedAt }) => ({
        name,
        issuer,
        issuedAt,
      })),
    };
  }

  /** Categories in first-seen order of the admin's skill ordering. */
  private groupSkills(skills: readonly Skill[]): SkillGroup[] {
    const groups = new Map<string, string[]>();
    for (const skill of skills.toSorted((a, b) => a.order - b.order)) {
      const category = skill.category.trim() || "Other";
      groups.set(category, [...(groups.get(category) ?? []), skill.name]);
    }
    return [...groups].map(([category, names]) => ({ category, skills: names }));
  }
}
