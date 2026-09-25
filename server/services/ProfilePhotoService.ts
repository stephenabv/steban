import type { ManagedFile } from "@/server/domain/entities";
import type { ManagedFileRepository } from "@/server/repositories";
import { ImageFilePolicy } from "@/server/security/files";
import { ManagedFileService } from "./ManagedFileService";

/** Public route prefix; see app/profile-photo/[version]/route.ts. */
export const PROFILE_PHOTO_ROUTE = "/profile-photo";
/** Hex characters of the content hash used as the URL version. */
export const PROFILE_PHOTO_VERSION_LENGTH = 16;

/** The hero profile photo: a single JPEG/PNG/WebP image. */
export class ProfilePhotoService extends ManagedFileService {
  constructor(repo: ManagedFileRepository) {
    super(repo, new ImageFilePolicy());
  }

  /**
   * Content-addressed public path. A new upload changes the URL, so browsers,
   * CDNs and the image optimizer can cache each version forever. The version
   * lives in the path (not a query string) so `next/image` can be restricted
   * to query-less local sources.
   */
  static publicPath(file: Pick<ManagedFile, "sha256">): string {
    return `${PROFILE_PHOTO_ROUTE}/${ProfilePhotoService.version(file)}`;
  }

  static version(file: Pick<ManagedFile, "sha256">): string {
    return file.sha256.slice(0, PROFILE_PHOTO_VERSION_LENGTH);
  }
}
