import type {
  ApplicantProfile,
  CoverLetterAction,
  CoverLetterContent,
  CoverLetterEdit,
  GeneratorStrategy,
  JobApplicationContent,
  RegenerationOptions,
} from "@/server/domain/coverLetter";
import {
  CoverLetterError,
  CoverLetterLifecycle,
  CoverLetterNotFoundError,
  DEFAULT_HIRING_MANAGER,
  LETTER_TIME_ZONE,
  LetterText,
} from "@/server/domain/coverLetter";
import type { Result } from "@/server/domain/types";
import { err, ok } from "@/server/domain/types";
import type {
  CoverLetterPatch,
  CoverLetterRecord,
  CoverLetterRepository,
  CoverLetterSummary,
} from "@/server/repositories/coverLetter/CoverLetterRepository";
import type { Clock } from "./Clock";
import type { ExportFormat, ExportedFile } from "./exporters/CoverLetterExporter";
import type { CoverLetterExporterRegistry } from "./exporters/CoverLetterExporterRegistry";
import type { CoverLetterGeneratorFactory } from "./generators/CoverLetterGeneratorFactory";
import type { HonestyGuard } from "./generators/HonestyGuard";
import type { GeneratedLetter } from "./generators/LetterDraft";
import type { ProfileMatcher } from "./ProfileMatcher";
import type { ProfileService } from "./ProfileService";
import type { RequirementExtractor } from "./RequirementExtractor";

export interface CoverLetterServiceDependencies {
  profiles: ProfileService;
  extractor: RequirementExtractor;
  matcher: ProfileMatcher;
  generators: CoverLetterGeneratorFactory;
  repository: CoverLetterRepository;
  exporters: CoverLetterExporterRegistry;
  honestyGuard: HonestyGuard;
  clock: Clock;
}

/** An application as submitted: the letter date may be left for the server to default. */
export type JobApplicationInput = Omit<JobApplicationContent, "letterDate"> & {
  letterDate?: string;
};

export interface GenerationOutcome {
  record: CoverLetterRecord;
  wordCount: number;
  removedTerms: string[];
  notices: string[];
}

export interface RegenerateCommand extends RegenerationOptions {
  strategy: GeneratorStrategy;
}

export interface SaveOutcome {
  record: CoverLetterRecord;
  /** Technologies typed into the letter that the profile does not back. Saving is still allowed. */
  warnings: string[];
}

const toError = (e: unknown): Error => (e instanceof Error ? e : new Error(String(e)));

/**
 * Application-layer facade for cover letters; the only entry point server
 * actions and route handlers use. Every operation is scoped to `ownerId`.
 */
export class CoverLetterService {
  constructor(private readonly deps: CoverLetterServiceDependencies) {}

  getProfile(): Promise<Result<ApplicantProfile>> {
    return this.attempt(() => this.deps.profiles.getProfile());
  }

  availableStrategies(): GeneratorStrategy[] {
    return this.deps.generators.availableStrategies();
  }

  /** Default letter date: today in Asia/Manila. */
  today(): string {
    return this.deps.clock.today(LETTER_TIME_ZONE);
  }

  generate(
    ownerId: string,
    input: JobApplicationInput,
    strategy: GeneratorStrategy
  ): Promise<Result<GenerationOutcome>> {
    return this.attempt(async () => {
      const application: JobApplicationContent = {
        ...input,
        hiringManager: input.hiringManager.trim() || DEFAULT_HIRING_MANAGER,
        letterDate: input.letterDate || this.today(),
      };
      const { letter, content } = await this.write(application, strategy);
      const record = await this.deps.repository.create(ownerId, { application, content });
      return this.outcome(record, letter);
    });
  }

  regenerate(
    ownerId: string,
    id: string,
    { strategy, tone, length }: RegenerateCommand
  ): Promise<Result<GenerationOutcome>> {
    return this.attempt(async () => {
      const existing = await this.require(ownerId, id);
      if (!CoverLetterLifecycle.can(existing.letter.status, "regenerate")) {
        throw new CoverLetterError(CoverLetterLifecycle.reason("regenerate"));
      }
      const { letter, content } = await this.write(
        { ...existing.application, tone, length },
        strategy
      );
      const record = await this.transition(ownerId, id, "regenerate", {
        content,
        application: { tone, length },
      });
      return this.outcome(record, letter);
    });
  }

  saveEdit(ownerId: string, id: string, edit: CoverLetterEdit): Promise<Result<SaveOutcome>> {
    return this.attempt(async () => {
      const existing = await this.require(ownerId, id);
      const profile = await this.deps.profiles.getProfile();
      const sections = { ...existing.letter.sections, ...edit };
      const record = await this.transition(ownerId, id, "edit", {
        content: { sections, plainText: LetterText.toPlainText(sections) },
      });
      const context = this.deps.honestyGuard.context(profile, existing.application);
      return { record, warnings: this.deps.honestyGuard.inspect(edit.body, context) };
    });
  }

  finalize(ownerId: string, id: string): Promise<Result<CoverLetterRecord>> {
    return this.attempt(() => this.transition(ownerId, id, "finalize", { status: "final" }));
  }

  reopen(ownerId: string, id: string): Promise<Result<CoverLetterRecord>> {
    return this.attempt(() => this.transition(ownerId, id, "reopen", { status: "draft" }));
  }

  get(ownerId: string, id: string): Promise<Result<CoverLetterRecord>> {
    return this.attempt(() => this.require(ownerId, id));
  }

  list(ownerId: string): Promise<Result<CoverLetterSummary[]>> {
    return this.attempt(() => this.deps.repository.list(ownerId));
  }

  delete(ownerId: string, id: string): Promise<Result<true>> {
    return this.attempt(async () => {
      if (!(await this.deps.repository.delete(ownerId, id))) throw new CoverLetterNotFoundError();
      return true as const;
    });
  }

  /** A new application pre-filled from an existing one, with company-specific fields cleared. */
  duplicateForNewCompany(ownerId: string, id: string): Promise<Result<JobApplicationContent>> {
    return this.attempt(async () => {
      const { application } = await this.require(ownerId, id);
      return {
        companyName: "",
        companyLocation: undefined,
        hiringManager: DEFAULT_HIRING_MANAGER,
        positionTitle: application.positionTitle,
        workArrangement: application.workArrangement,
        jobDescription: application.jobDescription,
        industryContext: undefined,
        postingUrl: undefined,
        letterDate: this.today(),
        tone: application.tone,
        length: application.length,
      };
    });
  }

  export(ownerId: string, id: string, format: ExportFormat): Promise<Result<ExportedFile>> {
    return this.attempt(async () => {
      const { letter, application } = await this.require(ownerId, id);
      return this.deps.exporters.get(format).export({
        sections: letter.sections,
        companyName: application.companyName,
        positionTitle: application.positionTitle,
      });
    });
  }

  /** Profile → requirements → matches → generator. */
  private async write(
    application: JobApplicationContent,
    strategy: GeneratorStrategy
  ): Promise<{ letter: GeneratedLetter; content: CoverLetterContent }> {
    const generator = this.deps.generators.create(strategy);
    const profile = await this.deps.profiles.getProfile();
    const requirements = this.deps.extractor.extract(application.jobDescription);
    const matchReport = this.deps.matcher.match(profile, requirements);
    const letter = await generator.generate({ profile, application, report: matchReport });
    return {
      letter,
      content: {
        generator: letter.strategy,
        sections: letter.sections,
        plainText: letter.plainText,
        matchReport,
      },
    };
  }

  private outcome(record: CoverLetterRecord, letter: GeneratedLetter): GenerationOutcome {
    return {
      record,
      wordCount: letter.wordCount,
      removedTerms: letter.removedTerms,
      notices: letter.notices,
    };
  }

  private async require(ownerId: string, id: string): Promise<CoverLetterRecord> {
    const record = await this.deps.repository.findById(ownerId, id);
    if (!record) throw new CoverLetterNotFoundError();
    return record;
  }

  /** Conditional write; when it doesn't apply, explains why (gone, or wrong status). */
  private async transition(
    ownerId: string,
    id: string,
    action: CoverLetterAction,
    patch: CoverLetterPatch
  ): Promise<CoverLetterRecord> {
    const allowed = CoverLetterLifecycle.statusesAllowing(action);
    const updated = await this.deps.repository.update(ownerId, id, patch, allowed);
    if (updated) return updated;
    await this.require(ownerId, id);
    throw new CoverLetterError(CoverLetterLifecycle.reason(action));
  }

  private async attempt<T>(work: () => Promise<T>): Promise<Result<T>> {
    try {
      return ok(await work());
    } catch (e) {
      return err(toError(e));
    }
  }
}
