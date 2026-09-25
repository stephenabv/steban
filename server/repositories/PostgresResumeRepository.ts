import { randomUUID } from "crypto";
import { getPool } from "@/server/db/pool";
import type { CreateResumeFileInput, ResumeFile, ResumeFileContent } from "@/server/domain/entities";
import { ResumeRepository } from "./ResumeRepository";

interface ResumeRow {
  id: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  sha256: string;
  uploaded_at: string;
}

interface ResumeContentRow extends ResumeRow {
  content: Buffer;
}

const META_COLUMNS = "id, file_name, content_type, size_bytes, sha256, uploaded_at";

function toResume(row: ResumeRow): ResumeFile {
  return {
    id: row.id,
    fileName: row.file_name,
    contentType: row.content_type,
    sizeBytes: Number(row.size_bytes),
    sha256: row.sha256,
    uploadedAt: new Date(row.uploaded_at),
  };
}

let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  // The partial unique index guarantees at most one active resume.
  tableReady ??= getPool()
    .query(
      `CREATE TABLE IF NOT EXISTS resume_files (
        id           TEXT PRIMARY KEY,
        file_name    TEXT NOT NULL,
        content_type TEXT NOT NULL,
        size_bytes   INT NOT NULL,
        sha256       TEXT NOT NULL,
        content      BYTEA NOT NULL,
        is_active    BOOLEAN NOT NULL DEFAULT FALSE,
        uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uq_resume_files_active
        ON resume_files (is_active) WHERE is_active;`
    )
    .then(() => undefined);
  return tableReady;
}

/**
 * Stores resumes in the existing Postgres database (the app's only persistent
 * store), so no additional storage service or dependency is required.
 */
export class PostgresResumeRepository extends ResumeRepository {
  async findActive(): Promise<ResumeFile | null> {
    await ensureTable();
    const { rows } = await getPool().query<ResumeRow>(
      `SELECT ${META_COLUMNS} FROM resume_files WHERE is_active LIMIT 1`
    );
    return rows[0] ? toResume(rows[0]) : null;
  }

  async findActiveContent(): Promise<ResumeFileContent | null> {
    await ensureTable();
    const { rows } = await getPool().query<ResumeContentRow>(
      `SELECT ${META_COLUMNS}, content FROM resume_files WHERE is_active LIMIT 1`
    );
    return rows[0] ? { ...toResume(rows[0]), content: rows[0].content } : null;
  }

  /**
   * Insert → switch active → prune, in one transaction. If any step fails the
   * transaction rolls back and the previously active resume is untouched, so
   * deleting the old file inside the same transaction carries no rollback risk
   * and no unused files accumulate.
   */
  async replaceActive(input: CreateResumeFileInput): Promise<ResumeFile> {
    await ensureTable();
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const id = randomUUID();
      const { rows } = await client.query<ResumeRow>(
        `INSERT INTO resume_files (id, file_name, content_type, size_bytes, sha256, content, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, FALSE)
         RETURNING ${META_COLUMNS}`,
        [id, input.fileName, input.contentType, input.content.length, input.sha256, input.content]
      );
      await client.query("UPDATE resume_files SET is_active = FALSE WHERE is_active");
      await client.query("UPDATE resume_files SET is_active = TRUE WHERE id = $1", [id]);
      await client.query("DELETE FROM resume_files WHERE id <> $1", [id]);
      await client.query("COMMIT");
      return toResume(rows[0]);
    } catch (e) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw e;
    } finally {
      client.release();
    }
  }
}
