import type { ManagedFileRepository } from "@/server/repositories";
import { PdfFilePolicy } from "@/server/security/files";
import { ManagedFileService } from "./ManagedFileService";

/** The downloadable resume: a single PDF served at `/resume.pdf`. */
export class ResumeService extends ManagedFileService {
  constructor(repo: ManagedFileRepository) {
    super(repo, new PdfFilePolicy());
  }
}
