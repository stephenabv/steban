import "server-only";
import type { DocumentStore } from "./DocumentStore";
import { JsonDocumentStore } from "./JsonDocumentStore";
import { PostgresDocumentStore } from "./PostgresDocumentStore";

let instance: DocumentStore | null = null;

/** Postgres when DATABASE_URL/POSTGRES_URL is set (production), else local JSON files. */
export function getDocumentStore(): DocumentStore {
  instance ??=
    process.env.DATABASE_URL || process.env.POSTGRES_URL ? new PostgresDocumentStore() : new JsonDocumentStore();
  return instance;
}
