import "server-only";
import { SoftSkillCatalog, TechnologyLexicon } from "@/server/domain/coverLetter";
import { AnthropicLlmClient } from "@/server/integrations/llm/AnthropicLlmClient";
import type { CoverLetterRepository } from "@/server/repositories/coverLetter/CoverLetterRepository";
import { JsonCoverLetterRepository } from "@/server/repositories/coverLetter/JsonCoverLetterRepository";
import { PortfolioProfileDataSource } from "@/server/repositories/coverLetter/PortfolioProfileDataSource";
import { PostgresCoverLetterRepository } from "@/server/repositories/coverLetter/PostgresCoverLetterRepository";
import { SystemClock } from "./Clock";
import { CoverLetterConfig } from "./CoverLetterConfig";
import { CoverLetterService } from "./CoverLetterService";
import { CoverLetterExporterRegistry } from "./exporters/CoverLetterExporterRegistry";
import { DocxExporter } from "./exporters/DocxExporter";
import { PdfExporter } from "./exporters/PdfExporter";
import { PlainTextExporter } from "./exporters/PlainTextExporter";
import { AiCoverLetterGenerator } from "./generators/AiCoverLetterGenerator";
import type { CoverLetterGenerator } from "./generators/CoverLetterGenerator";
import { CoverLetterGeneratorFactory } from "./generators/CoverLetterGeneratorFactory";
import { HonestyGuard } from "./generators/HonestyGuard";
import { LengthEnforcer } from "./generators/LengthEnforcer";
import { LetterSectionRenderer } from "./generators/LetterSectionRenderer";
import { StyleGuard } from "./generators/StyleGuard";
import { TemplateCoverLetterGenerator } from "./generators/TemplateCoverLetterGenerator";
import { ProfileMatcher } from "./ProfileMatcher";
import { ProfileService } from "./ProfileService";
import { RequirementExtractor } from "./RequirementExtractor";

let instance: CoverLetterService | null = null;

function createRepository(): CoverLetterRepository {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL
    ? new PostgresCoverLetterRepository()
    : new JsonCoverLetterRepository();
}

/**
 * Composition root: wires the cover letter object graph once per instance.
 * Postgres when DATABASE_URL/POSTGRES_URL is set, otherwise data/ JSON files.
 */
export function getCoverLetterService(): CoverLetterService {
  if (instance) return instance;

  const config = CoverLetterConfig.fromEnv();
  const lexicon = new TechnologyLexicon();
  const softSkills = new SoftSkillCatalog();
  const honestyGuard = new HonestyGuard(lexicon);
  const generatorDeps = {
    lexicon,
    honestyGuard,
    styleGuard: new StyleGuard(),
    lengthEnforcer: new LengthEnforcer(),
    sectionRenderer: new LetterSectionRenderer(),
  };
  const template = new TemplateCoverLetterGenerator(generatorDeps);
  const generators: CoverLetterGenerator[] = [template];
  if (config.ai) {
    generators.push(
      new AiCoverLetterGenerator(generatorDeps, new AnthropicLlmClient(config.ai), template)
    );
  }

  instance = new CoverLetterService({
    profiles: new ProfileService(new PortfolioProfileDataSource()),
    extractor: new RequirementExtractor(lexicon, softSkills),
    matcher: new ProfileMatcher(lexicon, softSkills),
    generators: new CoverLetterGeneratorFactory(generators),
    repository: createRepository(),
    exporters: new CoverLetterExporterRegistry([
      new PdfExporter(),
      new DocxExporter(),
      new PlainTextExporter(),
    ]),
    honestyGuard,
    clock: new SystemClock(),
  });
  return instance;
}
