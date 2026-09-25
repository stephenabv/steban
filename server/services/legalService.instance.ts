import "server-only";
import { LegalDocumentService } from "./LegalDocumentService";
import { LEGAL_DEFAULTS } from "@/config/legalDefaults";
import { JsonLegalDocumentRepository } from "@/server/repositories/JsonLegalDocumentRepository";
import { PostgresLegalDocumentRepository } from "@/server/repositories/PostgresLegalDocumentRepository";

let instance: LegalDocumentService | null = null;

/**
 * App-wide LegalDocumentService singleton: Postgres when DATABASE_URL or
 * POSTGRES_URL is configured, otherwise data/legal-versions.json.
 */
export function getLegalDocumentService(): LegalDocumentService {
  instance ??= new LegalDocumentService(
    process.env.DATABASE_URL || process.env.POSTGRES_URL
      ? new PostgresLegalDocumentRepository()
      : new JsonLegalDocumentRepository(),
    LEGAL_DEFAULTS
  );
  return instance;
}
