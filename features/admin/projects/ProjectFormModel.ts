import type { CreateProjectActionInput } from "../projectActions";

/** Serialisable project shape passed from admin Server Components to the client. */
export interface AdminProjectRow {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  coverImage: string;
  technologies: string[];
  features: string[];
  githubUrl?: string;
  liveUrl?: string;
  featured: boolean;
  publishedAt: string;
  updatedAt: string;
}

/** Editable form state — list fields are kept as the text the user types. */
export interface ProjectFormValues {
  title: string;
  slug: string;
  summary: string;
  description: string;
  techStack: string;
  features: string;
  liveUrl: string;
  repoUrl: string;
  imageUrl: string;
  featured: boolean;
}

/** Limits mirrored from the Server Action's Zod schema, for inline guidance only. */
export const PROJECT_LIMITS = { summary: 300, description: 10000 } as const;

/**
 * Maps between persisted projects, form state, and Server Action input.
 * Server-side validation in projectActions.ts remains the source of truth.
 */
export class ProjectFormModel {
  static empty(): ProjectFormValues {
    return {
      title: "",
      slug: "",
      summary: "",
      description: "",
      techStack: "",
      features: "",
      liveUrl: "",
      repoUrl: "",
      imageUrl: "",
      featured: false,
    };
  }

  static fromProject(project: AdminProjectRow): ProjectFormValues {
    return {
      title: project.title,
      slug: project.slug,
      summary: project.summary,
      description: project.description,
      techStack: project.technologies.join(", "),
      features: project.features.join("\n"),
      liveUrl: project.liveUrl ?? "",
      repoUrl: project.githubUrl ?? "",
      imageUrl: project.coverImage,
      featured: project.featured,
    };
  }

  static toActionInput(values: ProjectFormValues): CreateProjectActionInput {
    return {
      title: values.title,
      slug: values.slug,
      summary: values.summary,
      description: values.description,
      technologies: ProjectFormModel.splitList(values.techStack, ","),
      features: ProjectFormModel.splitList(values.features, "\n"),
      coverImage: values.imageUrl.trim(),
      liveUrl: values.liveUrl.trim(),
      githubUrl: values.repoUrl.trim(),
      featured: values.featured,
    };
  }

  /** Full action input for an existing project with selected fields overridden. */
  static withOverrides(project: AdminProjectRow, overrides: Partial<ProjectFormValues>): CreateProjectActionInput {
    return ProjectFormModel.toActionInput({ ...ProjectFormModel.fromProject(project), ...overrides });
  }

  static slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private static splitList(value: string, separator: string): string[] {
    return value
      .split(separator)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}
