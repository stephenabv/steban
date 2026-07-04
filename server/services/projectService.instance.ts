import "server-only";
import { ProjectService } from "./ProjectService";
import { JsonProjectRepository } from "@/server/repositories/JsonProjectRepository";
import { PostgresProjectRepository } from "@/server/repositories/PostgresProjectRepository";

let instance: ProjectService | null = null;

/**
 * App-wide ProjectService singleton.
 * Uses Postgres when DATABASE_URL or POSTGRES_URL is configured (production),
 * otherwise a local JSON file store in data/projects.json (development).
 */
export function getProjectService(): ProjectService {
  instance ??= new ProjectService(
    process.env.DATABASE_URL || process.env.POSTGRES_URL
      ? new PostgresProjectRepository()
      : new JsonProjectRepository()
  );
  return instance;
}
