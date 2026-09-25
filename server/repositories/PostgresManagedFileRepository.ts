import { randomUUID } from "crypto";
import { getPool } from "@/server/db/pool";
import { ensureOnce } from "@/server/db/ensureOnce";
import type { CreateManagedFileInput, ManagedFile, ManagedFileContent } from "@/server/domain/entities";
import { ManagedFileRepository } from "./ManagedFileRepository";

/**
 * Tables are an allow-list, never caller input: the name is interpolated into
 * SQL identifiers. `resume_files` is the table the resume has always used.
 */
export type ManagedFileTable = "resume_files" | "profile_photos";
const ALLOWED_TABLES: ReadonlySet<string> = new Set<ManagedFileTable>(["resume_files", "profile_photos"]);

interface FileRow {
  id: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  sha256: string;
  uploaded_at: string;
}

interface FileContentRow extends FileRow {
  content: Buffer;
}

const META_COLUMNS = "id, file_name, content_type, size_bytes, sha256, uploaded_at";

function toManagedFile(row: FileRow): ManagedFile {
  return {
    id: row.id,
    fileName: row.file_name,
    contentType: row.content_type,
    sizeBytes: Number(row.size_bytes),
    sha256: row.sha256,
    uploadedAt: new Date(row.uploaded_at),
  };
}

/** One setup step per table, shared by every repository instance for it. */
const setupByTable = new Map<ManagedFileTable, () => Promise<void>>();

function ensureTable(table: ManagedFileTable): Promise<void> {
  let setup = setupByTable.get(table);
  if (!setup) {
    // The partial unique index guarantees at most one active file per table.
    setup = ensureOnce(() =>
      getPool().query(
        `CREATE TABLE IF NOT EXISTS ${table} (
          id           TEXT PRIMARY KEY,
          file_name    TEXT NOT NULL,
          content_type TEXT NOT NULL,
          size_bytes   INT NOT NULL,
          sha256       TEXT NOT NULL,
          content      BYTEA NOT NULL,
          is_active    BOOLEAN NOT NULL DEFAULT FALSE,
          uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS uq_${table}_active
          ON ${table} (is_active) WHERE is_active;`
      )
    );
    setupByTable.set(table, setup);
  }
  return setup();
}

/**
 * Stores files in the existing Postgres database (the app's only persistent
 * store), so no additional storage service or dependency is required.
 */
export class PostgresManagedFileRepository extends ManagedFileRepository {
  constructor(private readonly table: ManagedFileTable) {
    super();
    if (!ALLOWED_TABLES.has(table)) throw new Error(`Unsupported managed file table: ${table}`);
  }

  async findActive(): Promise<ManagedFile | null> {
    await ensureTable(this.table);
    const { rows } = await getPool().query<FileRow>(`SELECT ${META_COLUMNS} FROM ${this.table} WHERE is_active LIMIT 1`);
    return rows[0] ? toManagedFile(rows[0]) : null;
  }

  async findActiveContent(): Promise<ManagedFileContent | null> {
    await ensureTable(this.table);
    const { rows } = await getPool().query<FileContentRow>(
      `SELECT ${META_COLUMNS}, content FROM ${this.table} WHERE is_active LIMIT 1`
    );
    return rows[0] ? { ...toManagedFile(rows[0]), content: rows[0].content } : null;
  }

  /**
   * Insert → switch active → prune, in one transaction. If any step fails the
   * transaction rolls back and the previously active file is untouched, so
   * deleting the old file inside the same transaction carries no rollback risk
   * and no unused files accumulate.
   */
  async replaceActive(input: CreateManagedFileInput): Promise<ManagedFile> {
    await ensureTable(this.table);
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const id = randomUUID();
      const { rows } = await client.query<FileRow>(
        `INSERT INTO ${this.table} (id, file_name, content_type, size_bytes, sha256, content, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, FALSE)
         RETURNING ${META_COLUMNS}`,
        [id, input.fileName, input.contentType, input.content.length, input.sha256, input.content]
      );
      await client.query(`UPDATE ${this.table} SET is_active = FALSE WHERE is_active`);
      await client.query(`UPDATE ${this.table} SET is_active = TRUE WHERE id = $1`, [id]);
      await client.query(`DELETE FROM ${this.table} WHERE id <> $1`, [id]);
      await client.query("COMMIT");
      return toManagedFile(rows[0]);
    } catch (e) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw e;
    } finally {
      client.release();
    }
  }

  async clearActive(): Promise<boolean> {
    await ensureTable(this.table);
    const { rowCount } = await getPool().query(`DELETE FROM ${this.table}`);
    return (rowCount ?? 0) > 0;
  }
}
