import type {
  ApplicantProfile,
  CoverLetterSections,
  JobApplicationContent,
  Paragraph,
} from "@/server/domain/coverLetter";
import { CLOSING_LINES } from "@/server/domain/coverLetter";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "https://www.github.com/x/" → "github.com/x" for a compact header. */
const displayUrl = (url: string): string =>
  url
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");

/** Lays out the fixed parts of a letter around its body, all from profile and application data. */
export class LetterSectionRenderer {
  render(
    profile: ApplicantProfile,
    application: JobApplicationContent,
    body: Paragraph[]
  ): CoverLetterSections {
    const { contact } = profile;
    return {
      header: {
        fullName: profile.fullName,
        lines: [
          contact.email,
          ...[contact.portfolioUrl, contact.githubUrl, contact.linkedinUrl].map(
            (url) => url && displayUrl(url)
          ),
        ].filter((line): line is string => Boolean(line)),
      },
      date: LetterSectionRenderer.formatDate(application.letterDate),
      recipient: [application.hiringManager, application.companyName, application.companyLocation]
        .map((line) => line?.trim())
        .filter((line): line is string => Boolean(line)),
      salutation: `Dear ${application.hiringManager.trim()},`,
      body,
      closing: [...CLOSING_LINES],
      signature: profile.fullName,
    };
  }

  /** `YYYY-MM-DD` → "October 2, 2026", independent of the server's time zone. */
  static formatDate(isoDate: string): string {
    const [year, month, day] = isoDate.split("-").map(Number);
    return DATE_FORMAT.format(new Date(Date.UTC(year, month - 1, day)));
  }
}
