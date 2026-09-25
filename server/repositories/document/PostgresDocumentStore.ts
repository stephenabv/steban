import { getPool } from "@/server/db/pool";
import { ensureOnce } from "@/server/db/ensureOnce";
import { DocumentStore } from "./DocumentStore";
import type { StoredDocument } from "./DocumentStore";

interface ContentRow {
  data: unknown;
  updated_at: string;
}

const ensureTable = ensureOnce(() =>
  getPool().query(
    `CREATE TABLE IF NOT EXISTS site_content (
        key        TEXT PRIMARY KEY,
        data       JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`
  )
);

/** Production document store in the existing Postgres database. */
export class PostgresDocumentStore extends DocumentStore {
  async read<T>(key: string): Promise<StoredDocument<T> | null> {
    this.assertKey(key);
    await ensureTable();
    const { rows } = await getPool().query<ContentRow>(
      "SELECT data, updated_at FROM site_content WHERE key = $1",
      [key]
    );
    return rows[0] ? { data: rows[0].data as T, updatedAt: new Date(rows[0].updated_at) } : null;
  }

  async write<T>(key: string, data: T): Promise<StoredDocument<T>> {
    this.assertKey(key);
    await ensureTable();
    const { rows } = await getPool().query<ContentRow>(
      `INSERT INTO site_content (key, data, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
       RETURNING data, updated_at`,
      [key, JSON.stringify(data)]
    );
    return { data: rows[0].data as T, updatedAt: new Date(rows[0].updated_at) };
  }
}
