import "server-only";
import { ResumeService } from "./ResumeService";
import { ProfilePhotoService } from "./ProfilePhotoService";
import type { ManagedFileRepository } from "@/server/repositories";
import { JsonManagedFileRepository, type ManagedFileDir } from "@/server/repositories/JsonManagedFileRepository";
import { PostgresManagedFileRepository, type ManagedFileTable } from "@/server/repositories/PostgresManagedFileRepository";

/**
 * Postgres when DATABASE_URL or POSTGRES_URL is configured (production),
 * otherwise a local file store under data/<dir> (development).
 */
function createRepository(table: ManagedFileTable, dir: ManagedFileDir): ManagedFileRepository {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL
    ? new PostgresManagedFileRepository(table)
    : new JsonManagedFileRepository(dir);
}

let resume: ResumeService | null = null;
let profilePhoto: ProfilePhotoService | null = null;

/** App-wide ResumeService singleton. */
export function getResumeService(): ResumeService {
  resume ??= new ResumeService(createRepository("resume_files", "resume"));
  return resume;
}

/** App-wide ProfilePhotoService singleton. */
export function getProfilePhotoService(): ProfilePhotoService {
  profilePhoto ??= new ProfilePhotoService(createRepository("profile_photos", "profile-photo"));
  return profilePhoto;
}
