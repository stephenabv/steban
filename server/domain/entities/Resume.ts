import type { CreateManagedFileInput, ManagedFile, ManagedFileContent } from "./ManagedFile";

/** The resume is a managed file; these aliases keep existing call sites readable. */
export type ResumeFile = ManagedFile;
export type ResumeFileContent = ManagedFileContent;
export type CreateResumeFileInput = CreateManagedFileInput;
