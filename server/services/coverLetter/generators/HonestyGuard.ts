import type {
  ApplicantProfile,
  JobApplicationContent,
  Paragraph,
  TechnologyLexicon,
} from "@/server/domain/coverLetter";
import { HonestyViolationError, LetterText, ProfileVocabulary } from "@/server/domain/coverLetter";
import type { LetterDraft } from "./LetterDraft";

export interface HonestyContext {
  vocabulary: ProfileVocabulary;
  /**
   * Text the admin typed (company, position, location…). A technology named
   * there, e.g. "React Developer", is the job's name, not a claim, so those
   * spans are ignored when scanning.
   */
  literalPhrases: readonly string[];
}

export interface HonestyResult {
  draft: LetterDraft;
  removedTerms: string[];
}

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Links are addresses, not claims: "steban.vercel.app" does not claim Vercel. */
const URL_PATTERN = /\bhttps?:\/\/\S+/giu;

const blank = (match: string): string => " ".repeat(match.length);

/**
 * Ensures the letter never claims a technology the profile cannot back.
 * `enforce` repairs a draft by dropping offending sentences; `verify` is the
 * final gate and throws instead of repairing.
 */
export class HonestyGuard {
  constructor(private readonly lexicon: TechnologyLexicon) {}

  context(profile: ApplicantProfile, application: JobApplicationContent): HonestyContext {
    return {
      vocabulary: ProfileVocabulary.fromProfile(profile, this.lexicon),
      literalPhrases: [
        application.positionTitle,
        application.companyName,
        application.companyLocation ?? "",
        application.hiringManager,
        application.industryContext ?? "",
        application.workArrangement.schedule,
        profile.contact.email,
        profile.contact.portfolioUrl,
        profile.contact.githubUrl ?? "",
        profile.contact.linkedinUrl ?? "",
        ...profile.projects.map((project) => project.liveUrl ?? ""),
      ],
    };
  }

  /** Technologies named in `text` that the profile does not contain. */
  findViolations(text: string, context: HonestyContext): string[] {
    const scanned = context.literalPhrases
      .map((phrase) => phrase.trim())
      .filter(Boolean)
      .reduce(
        (masked, phrase) => masked.replace(new RegExp(escapeRegExp(phrase), "giu"), blank),
        text.replace(URL_PATTERN, blank)
      );
    return this.lexicon
      .findMentions(scanned)
      .map(({ term }) => term.name)
      .filter((name) => !context.vocabulary.has(name));
  }

  /** Violations across a whole body, sorted and de-duplicated. */
  inspect(body: readonly Paragraph[], context: HonestyContext): string[] {
    const found = body.flatMap((paragraph) =>
      this.findViolations(LetterText.paragraphText(paragraph), context)
    );
    return [...new Set(found)].sort();
  }

  enforce(draft: LetterDraft, context: HonestyContext): HonestyResult {
    const removed = new Set<string>();
    const paragraphs = draft.paragraphs.map((paragraph) =>
      paragraph.filter((item) => {
        const violations = this.findViolations(LetterText.paragraphText(item.runs), context);
        violations.forEach((term) => removed.add(term));
        return violations.length === 0;
      })
    );
    return { draft: { paragraphs }, removedTerms: [...removed].sort() };
  }

  verify(body: readonly Paragraph[], context: HonestyContext): void {
    const violations = this.inspect(body, context);
    if (violations.length > 0) throw new HonestyViolationError(violations);
  }
}
