import "server-only";
import { getContactService } from "../contactService.instance";
import { getCoverLetterService } from "../coverLetter/coverLetterService.instance";
import { getLegalDocumentService } from "../legalService.instance";
import { getProjectService } from "../projectService.instance";
import { AdminSearchService } from "./AdminSearchService";
import { CoverLetterSearchProvider } from "./providers/CoverLetterSearchProvider";
import { LegalVersionSearchProvider } from "./providers/LegalVersionSearchProvider";
import { MessageSearchProvider } from "./providers/MessageSearchProvider";
import { ProjectSearchProvider } from "./providers/ProjectSearchProvider";

let instance: AdminSearchService | null = null;

/** Composition root for admin search; providers are listed in palette order. */
export function getAdminSearchService(): AdminSearchService {
  instance ??= new AdminSearchService(
    [
      new ProjectSearchProvider(getProjectService()),
      new MessageSearchProvider(getContactService()),
      new CoverLetterSearchProvider(getCoverLetterService()),
      new LegalVersionSearchProvider(getLegalDocumentService()),
    ],
    (group, error) => console.error(`[admin-search] ${group} provider failed`, error)
  );
  return instance;
}
