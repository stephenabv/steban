import "server-only";
import { ResumeService } from "./ResumeService";
import { JsonResumeRepository } from "@/server/repositories/JsonResumeRepository";
import { PostgresResumeRepository } from "@/server/repositories/PostgresResumeRepository";

let instance: ResumeService | null = null;

/**
 * App-wide ResumeService singleton.
 * Uses Postgres when DATABASE_URL or POSTGRES_URL is configured (production),
 * otherwise a local file store under data/resume (development).
 */
export function getResumeService(): ResumeService {
  instance ??= new ResumeService(
    process.env.DATABASE_URL || process.env.POSTGRES_URL
      ? new PostgresResumeRepository()
      : new JsonResumeRepository()
  );
  return instance;
}
