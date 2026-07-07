import "server-only";
import { ContactService } from "./ContactService";
import {
  JsonContactInfoRepository,
  JsonContactMessageRepository,
} from "@/server/repositories/JsonContactRepository";
import {
  PostgresContactInfoRepository,
  PostgresContactMessageRepository,
} from "@/server/repositories/PostgresContactRepository";

let instance: ContactService | null = null;

/**
 * App-wide ContactService singleton.
 * Uses Postgres when DATABASE_URL or POSTGRES_URL is configured (production),
 * otherwise a local JSON file store under data/ (development).
 */
export function getContactService(): ContactService {
  if (instance) return instance;

  const usePostgres = Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);

  instance = usePostgres
    ? new ContactService(
        new PostgresContactInfoRepository(),
        new PostgresContactMessageRepository()
      )
    : new ContactService(new JsonContactInfoRepository(), new JsonContactMessageRepository());

  return instance;
}
