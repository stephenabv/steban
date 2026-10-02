import type { WorkArrangement } from "@/server/domain/coverLetter";
import type { DraftSentence, LetterOutline, OutlineHighlight } from "./LetterDraft";
import { boldList, sentence } from "./LetterDraft";

/** "a Senior Engineer", "an Engineer". */
const withArticle = (noun: string): string => `${/^[aeiou]/i.test(noun) ? "an" : "a"} ${noun}`;

/**
 * Deterministic wording for the template generator. The base class owns the
 * paragraph structure and the neutral sentences; each tone supplies the
 * sentences where voice matters.
 */
export abstract class LetterPhrasebook {
  /** Paragraph 1: the role, current position and one-line fit. */
  introduction(outline: LetterOutline): DraftSentence[] {
    const { application, profile } = outline.request;
    const current = outline.currentRole
      ? sentence([
          `I currently work at ${outline.currentRole.company} as ${withArticle(outline.currentRole.role)}.`,
        ])
      : profile.title
        ? sentence([`I work as ${withArticle(profile.title)}.`])
        : null;
    return [
      this.opening(application.positionTitle, application.companyName),
      ...(current ? [current] : []),
      outline.fitTechnologies.length > 0 ? this.fit(outline.fitTechnologies) : this.generalFit(),
    ];
  }

  /** Paragraph 2: the strongest roles and projects, naming the technologies the job asks for. */
  evidence(outline: LetterOutline): DraftSentence[] {
    const { application, profile } = outline.request;
    const sentences = outline.highlights.flatMap((highlight) => this.highlight(highlight));
    if (sentences.length === 0 && profile.title) {
      sentences.push(
        sentence([`My work as ${withArticle(profile.title)} has prepared me well for this role.`])
      );
    }
    if (outline.additionalTechnologies.length > 0) {
      sentences.push(this.alsoWith(outline.additionalTechnologies));
    }
    if (application.industryContext?.trim()) {
      sentences.push(
        sentence(
          [`That experience carries over well to ${application.industryContext.trim()}.`],
          true
        )
      );
    }
    return sentences;
  }

  /** Paragraph 3: working style, arrangement fit, portfolio link and a call to action. */
  closing(outline: LetterOutline): DraftSentence[] {
    const { application, profile } = outline.request;
    return [
      outline.softSkills.length > 0
        ? this.workingStyle(outline.softSkills)
        : this.generalWorkingStyle(),
      this.arrangement(application.workArrangement, application.companyLocation),
      sentence([`You can see more of my work at ${profile.contact.portfolioUrl}.`]),
      this.callToAction(application.companyName),
    ];
  }

  protected highlight(highlight: OutlineHighlight): DraftSentence[] {
    const lead =
      highlight.source === "experience"
        ? this.experienceLead(highlight)
        : this.projectLead(highlight);
    return [lead, ...highlight.details.map((detail) => sentence([detail], true))];
  }

  private experienceLead({ name, organization, technologies }: OutlineHighlight): DraftSentence {
    const role = `${withArticle(name)} at ${organization ?? ""}`.trim();
    return technologies.length > 0
      ? sentence([`As ${role}, I worked with `, ...boldList(technologies), "."])
      : sentence([`I worked as ${role}.`]);
  }

  private projectLead({ name, technologies }: OutlineHighlight): DraftSentence {
    return technologies.length > 0
      ? sentence([`I built ${name} with `, ...boldList(technologies), "."])
      : sentence([`I also built ${name}.`]);
  }

  protected arrangement(arrangement: WorkArrangement, location?: string): DraftSentence {
    const schedule = arrangement.schedule.trim();
    const hours = schedule ? `, and I can work ${schedule}` : "";
    switch (arrangement.mode) {
      case "remote":
        return sentence([`I'm set up to work remotely${hours}.`]);
      case "hybrid":
        return sentence([`A hybrid arrangement suits me well${hours}.`]);
      case "onsite":
        return sentence([
          `I'm able to work on-site${location?.trim() ? ` in ${location.trim()}` : ""}${hours}.`,
        ]);
    }
  }

  protected abstract opening(position: string, company: string): DraftSentence;
  protected abstract fit(technologies: readonly string[]): DraftSentence;
  protected abstract generalFit(): DraftSentence;
  protected abstract workingStyle(softSkills: readonly string[]): DraftSentence;
  /** Used when the job names no soft skill the profile shows; claims no specific skill. */
  protected abstract generalWorkingStyle(): DraftSentence;
  /** Matched technologies the earlier sentences left out. */
  protected abstract alsoWith(technologies: readonly string[]): DraftSentence;
  protected abstract callToAction(company: string): DraftSentence;
}

export class ProfessionalPhrasebook extends LetterPhrasebook {
  protected opening(position: string, company: string): DraftSentence {
    return sentence(["I am applying for the ", { bold: position }, ` role at ${company}.`]);
  }

  protected fit(technologies: readonly string[]): DraftSentence {
    return sentence([
      "My background in ",
      ...boldList(technologies),
      " matches the core of what this role needs.",
    ]);
  }

  protected generalFit(): DraftSentence {
    return sentence(["My recent work maps closely to the responsibilities of this role."]);
  }

  protected workingStyle(softSkills: readonly string[]): DraftSentence {
    return sentence([`In my work I put a strong emphasis on ${softSkills.join(" and ")}.`], true);
  }

  protected generalWorkingStyle(): DraftSentence {
    return sentence(["I aim to keep my work clear, tested and easy for others to build on."], true);
  }

  protected alsoWith(technologies: readonly string[]): DraftSentence {
    return sentence(
      ["I also work with ", ...boldList(technologies), ", which this role calls for."],
      true
    );
  }

  protected callToAction(company: string): DraftSentence {
    return sentence([`I would welcome the chance to discuss how I can contribute to ${company}.`]);
  }
}

export class WarmPhrasebook extends LetterPhrasebook {
  protected opening(position: string, company: string): DraftSentence {
    return sentence(["I'm glad to apply for the ", { bold: position }, ` role at ${company}.`]);
  }

  protected fit(technologies: readonly string[]): DraftSentence {
    return sentence([
      "My day-to-day work with ",
      ...boldList(technologies),
      " lines up well with what your team is looking for.",
    ]);
  }

  protected generalFit(): DraftSentence {
    return sentence(["The work I do today lines up well with what your team is looking for."]);
  }

  protected workingStyle(softSkills: readonly string[]): DraftSentence {
    return sentence([`People I work with can count on ${softSkills.join(" and ")} from me.`], true);
  }

  protected generalWorkingStyle(): DraftSentence {
    return sentence(
      ["I like leaving code a little clearer than I found it, for whoever works on it next."],
      true
    );
  }

  protected alsoWith(technologies: readonly string[]): DraftSentence {
    return sentence(
      ["I'm also comfortable with ", ...boldList(technologies), ", which your team uses."],
      true
    );
  }

  protected callToAction(company: string): DraftSentence {
    return sentence([`I'd love to talk about how I can help the team at ${company}.`]);
  }
}
