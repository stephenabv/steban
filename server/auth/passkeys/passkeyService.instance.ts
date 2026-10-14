import "server-only";
import { PasskeyService } from "./PasskeyService";
import type { PasskeyRepository } from "@/server/repositories/PasskeyRepository";
import { JsonPasskeyRepository } from "@/server/repositories/JsonPasskeyRepository";
import { PostgresPasskeyRepository } from "@/server/repositories/PostgresPasskeyRepository";

/**
 * Postgres when DATABASE_URL or POSTGRES_URL is configured (production),
 * otherwise a local file store under data/ (development).
 */
function createRepository(): PasskeyRepository {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL
    ? new PostgresPasskeyRepository()
    : new JsonPasskeyRepository();
}

let instance: PasskeyService | null = null;

/** App-wide PasskeyService singleton. */
export function getPasskeyService(): PasskeyService {
  instance ??= new PasskeyService(createRepository());
  return instance;
}
