import type { LetterTone } from "@/server/domain/coverLetter";
import type { GeneratorDependencies } from "./CoverLetterGenerator";
import { CoverLetterGenerator } from "./CoverLetterGenerator";
import type { LetterDraft, LetterOutline } from "./LetterDraft";
import type { LetterPhrasebook } from "./LetterPhrasebook";
import { ProfessionalPhrasebook, WarmPhrasebook } from "./LetterPhrasebook";

const DEFAULT_PHRASEBOOKS: Record<LetterTone, LetterPhrasebook> = {
  professional: new ProfessionalPhrasebook(),
  warm: new WarmPhrasebook(),
};

/**
 * Deterministic generator and the default strategy: composes the letter only
 * from matched profile evidence, with no external calls.
 */
export class TemplateCoverLetterGenerator extends CoverLetterGenerator {
  readonly strategy = "template";

  constructor(
    deps: GeneratorDependencies,
    private readonly phrasebooks: Record<LetterTone, LetterPhrasebook> = DEFAULT_PHRASEBOOKS
  ) {
    super(deps);
  }

  protected async compose(outline: LetterOutline): Promise<LetterDraft> {
    const phrasebook = this.phrasebooks[outline.request.application.tone];
    return {
      paragraphs: [
        phrasebook.introduction(outline),
        phrasebook.evidence(outline),
        phrasebook.closing(outline),
      ],
    };
  }
}
