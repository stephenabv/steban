import type { JobApplicationContent } from "@/server/domain/coverLetter";
import { SoftSkillCatalog, TechnologyLexicon } from "@/server/domain/coverLetter";
import type { Project } from "@/server/domain/entities";
import { InMemoryCoverLetterRepository } from "@/server/repositories/coverLetter/InMemoryCoverLetterRepository";
import { Clock } from "@/server/services/coverLetter/Clock";
import { CoverLetterService } from "@/server/services/coverLetter/CoverLetterService";
import { ProfileDataSource } from "@/server/services/coverLetter/ProfileDataSource";
import type { ProfileSourceData } from "@/server/services/coverLetter/ProfileDataSource";
import { ProfileMatcher } from "@/server/services/coverLetter/ProfileMatcher";
import { ProfileService } from "@/server/services/coverLetter/ProfileService";
import { RequirementExtractor } from "@/server/services/coverLetter/RequirementExtractor";
import { CoverLetterExporterRegistry } from "@/server/services/coverLetter/exporters/CoverLetterExporterRegistry";
import { DocxExporter } from "@/server/services/coverLetter/exporters/DocxExporter";
import { PdfExporter } from "@/server/services/coverLetter/exporters/PdfExporter";
import { PlainTextExporter } from "@/server/services/coverLetter/exporters/PlainTextExporter";
import { AiCoverLetterGenerator } from "@/server/services/coverLetter/generators/AiCoverLetterGenerator";
import type {
  CoverLetterGenerator,
  GeneratorDependencies,
} from "@/server/services/coverLetter/generators/CoverLetterGenerator";
import { CoverLetterGeneratorFactory } from "@/server/services/coverLetter/generators/CoverLetterGeneratorFactory";
import { HonestyGuard } from "@/server/services/coverLetter/generators/HonestyGuard";
import { LengthEnforcer } from "@/server/services/coverLetter/generators/LengthEnforcer";
import type { GenerationRequest } from "@/server/services/coverLetter/generators/LetterDraft";
import { LetterSectionRenderer } from "@/server/services/coverLetter/generators/LetterSectionRenderer";
import { StructuredLlmClient } from "@/server/services/coverLetter/generators/StructuredLlmClient";
import type { StructuredLlmRequest } from "@/server/services/coverLetter/generators/StructuredLlmClient";
import { StyleGuard } from "@/server/services/coverLetter/generators/StyleGuard";
import { TemplateCoverLetterGenerator } from "@/server/services/coverLetter/generators/TemplateCoverLetterGenerator";

export const TODAY = "2026-10-02";

function project(overrides: Partial<Project> & Pick<Project, "title" | "technologies">): Project {
  return {
    id: overrides.title.toLowerCase().replace(/\W+/g, "-"),
    slug: overrides.title.toLowerCase().replace(/\W+/g, "-"),
    summary: "",
    description: "",
    coverImage: "",
    gallery: [],
    features: [],
    featured: false,
    publishedAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

/** A realistic profile: React/TypeScript/Node, no Kubernetes, no Python. */
export function sampleProfileData(): ProfileSourceData {
  return {
    hero: {
      name: "Stephen Abueva",
      title: "Full-Stack Developer",
      introduction: "I build fast, accessible web applications.",
    },
    about: {
      biography: "Full-stack developer focused on React, Next.js and Node.js services.",
      skills: [
        { id: "s1", name: "TypeScript", category: "Languages", proficiencyLevel: 5, order: 1 },
        { id: "s2", name: "JavaScript", category: "Languages", proficiencyLevel: 5, order: 2 },
        { id: "s3", name: "React", category: "Frontend", proficiencyLevel: 5, order: 3 },
        { id: "s4", name: "Next.js", category: "Frontend", proficiencyLevel: 4, order: 4 },
        { id: "s5", name: "Node.js", category: "Backend", proficiencyLevel: 4, order: 5 },
        { id: "s6", name: "PostgreSQL", category: "Backend", proficiencyLevel: 4, order: 6 },
        { id: "s7", name: "Git", category: "Tools", proficiencyLevel: 5, order: 7 },
      ],
      experience: [
        {
          id: "e1",
          company: "Northwind Digital",
          role: "Senior Frontend Developer",
          startDate: new Date("2023-02-01"),
          current: true,
          description:
            "Led the migration of a customer portal from a legacy single-page app to Next.js and TypeScript. " +
            "Built a shared React component library used by four product teams. " +
            "Introduced end-to-end tests and code reviews for every pull request.",
          technologies: ["Next.js", "TypeScript", "React"],
        },
        {
          id: "e2",
          company: "Blue Harbor Labs",
          role: "Full-Stack Developer",
          startDate: new Date("2020-06-01"),
          endDate: new Date("2023-01-31"),
          current: false,
          description:
            "Built REST APIs in Node.js with PostgreSQL for a logistics dashboard used by dispatch teams. " +
            "Designed the database schema and wrote the reporting queries behind the daily shipment views. " +
            "Worked directly with operations staff to turn their requests into small, frequent releases.",
          technologies: ["Node.js", "PostgreSQL", "Express"],
        },
      ],
      education: [],
      certifications: [],
    },
    projects: [
      project({
        title: "Steban Portfolio",
        summary: "Personal portfolio with an admin dashboard.",
        description:
          "Built a portfolio site with a private admin dashboard for editing every page. " +
          "Wrote the content services against PostgreSQL with a JSON fallback for local development.",
        technologies: ["Next.js", "TypeScript", "PostgreSQL"],
        liveUrl: "https://steban.vercel.app",
      }),
    ],
    contact: {
      email: "stephen@example.com",
      githubUrl: "https://github.com/stephenabv",
      linkedinUrl: "https://www.linkedin.com/in/stephenabv",
    },
    portfolioUrl: "https://steban.vercel.app",
  };
}

export class FakeProfileDataSource extends ProfileDataSource {
  constructor(private readonly data: ProfileSourceData = sampleProfileData()) {
    super();
  }

  async load(): Promise<ProfileSourceData> {
    return this.data;
  }
}

export class FixedClock extends Clock {
  constructor(private readonly instant = new Date(`${TODAY}T03:00:00Z`)) {
    super();
  }

  now(): Date {
    return this.instant;
  }
}

/** Returns a canned answer, or throws when given an error. Records every request. */
export class FakeLlmClient extends StructuredLlmClient {
  readonly requests: StructuredLlmRequest<unknown>[] = [];

  constructor(private readonly answer: unknown) {
    super();
  }

  async generate<T>(request: StructuredLlmRequest<T>): Promise<T> {
    this.requests.push(request as StructuredLlmRequest<unknown>);
    if (this.answer instanceof Error) throw this.answer;
    return request.schema.parse(this.answer);
  }
}

export const SAMPLE_JOB_DESCRIPTION = `Frontend Engineer (Remote)

We are looking for a Frontend Engineer to join our product team.

Requirements:
- 3+ years of experience with React and TS
- Strong JS fundamentals
- Experience with Next.js and REST APIs
- Familiarity with Git/GitHub workflows
- Kubernetes experience is a plus
- Strong communication skills and attention to detail`;

export function sampleApplication(
  overrides: Partial<JobApplicationContent> = {}
): JobApplicationContent {
  return {
    companyName: "Acme Corp",
    companyLocation: "Makati City",
    hiringManager: "Hiring Manager",
    positionTitle: "Frontend Engineer",
    workArrangement: { mode: "remote", schedule: "" },
    jobDescription: SAMPLE_JOB_DESCRIPTION,
    letterDate: TODAY,
    tone: "professional",
    length: "standard",
    ...overrides,
  };
}

export const lexicon = new TechnologyLexicon();
export const softSkills = new SoftSkillCatalog();

export function generatorDependencies(): GeneratorDependencies {
  return {
    lexicon,
    honestyGuard: new HonestyGuard(lexicon),
    styleGuard: new StyleGuard(),
    lengthEnforcer: new LengthEnforcer(),
    sectionRenderer: new LetterSectionRenderer(),
  };
}

export function templateGenerator(): TemplateCoverLetterGenerator {
  return new TemplateCoverLetterGenerator(generatorDependencies());
}

export function aiGenerator(llm: StructuredLlmClient): AiCoverLetterGenerator {
  const deps = generatorDependencies();
  return new AiCoverLetterGenerator(deps, llm, new TemplateCoverLetterGenerator(deps));
}

/** The full service over in-memory storage and fakes; mirrors the production composition root. */
export function buildService(
  options: { generators?: CoverLetterGenerator[]; source?: ProfileDataSource } = {}
) {
  const repository = new InMemoryCoverLetterRepository();
  const service = new CoverLetterService({
    profiles: new ProfileService(options.source ?? new FakeProfileDataSource()),
    extractor: new RequirementExtractor(lexicon, softSkills),
    matcher: new ProfileMatcher(lexicon, softSkills),
    generators: new CoverLetterGeneratorFactory(options.generators ?? [templateGenerator()]),
    repository,
    exporters: new CoverLetterExporterRegistry([
      new PdfExporter(),
      new DocxExporter(),
      new PlainTextExporter(),
    ]),
    honestyGuard: new HonestyGuard(lexicon),
    clock: new FixedClock(),
  });
  return { service, repository };
}

/** Builds a generation request the way CoverLetterService does. */
export async function generationRequest(
  application = sampleApplication(),
  source: ProfileDataSource = new FakeProfileDataSource()
): Promise<GenerationRequest> {
  const profile = await new ProfileService(source).getProfile();
  const requirements = new RequirementExtractor(lexicon, softSkills).extract(
    application.jobDescription
  );
  const report = new ProfileMatcher(lexicon, softSkills).match(profile, requirements);
  return { profile, application, report };
}
