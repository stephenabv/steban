import { randomUUID } from "crypto";
import type { PoolClient } from "pg";
import { getPool } from "@/server/db/pool";
import { ensureOnce } from "@/server/db/ensureOnce";
import type {
  LegalDocumentKind,
  LegalDocumentVersion,
  LegalDraftContent,
  LegalVersionStatus,
} from "@/server/domain/entities";
import { LegalVersionLifecycle } from "@/server/domain/legal/LegalVersionLifecycle";
import { LegalDocumentRepository } from "./LegalDocumentRepository";

interface VersionRow {
  id: string;
  kind: LegalDocumentKind;
  version_number: number;
  title: string;
  body: string;
  change_note: string;
  status: LegalVersionStatus;
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
  unpublished_at: Date | null;
}

function toVersion(row: VersionRow): LegalDocumentVersion {
  return {
    id: row.id,
    kind: row.kind,
    versionNumber: row.version_number,
    title: row.title,
    body: row.body,
    changeNote: row.change_note,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    publishedAt: row.published_at ? new Date(row.published_at) : null,
    unpublishedAt: row.unpublished_at ? new Date(row.unpublished_at) : null,
  };
}

// The partial unique index guarantees at most one published version per kind,
// even if application code were to misbehave.
const ensureTable = ensureOnce(() =>
  getPool().query(
    `CREATE TABLE IF NOT EXISTS legal_document_versions (
        id              TEXT PRIMARY KEY,
        kind            TEXT NOT NULL CHECK (kind IN ('privacy', 'terms')),
        version_number  INT NOT NULL,
        title           TEXT NOT NULL,
        body            TEXT NOT NULL,
        change_note     TEXT NOT NULL DEFAULT '',
        status          TEXT NOT NULL CHECK (status IN ('draft', 'published', 'unpublished')),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        published_at    TIMESTAMPTZ,
        unpublished_at  TIMESTAMPTZ,
        UNIQUE (kind, version_number)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uq_legal_document_versions_published
        ON legal_document_versions (kind) WHERE status = 'published';`
  )
);

/** Production repository backed by Postgres. */
export class PostgresLegalDocumentRepository extends LegalDocumentRepository {
  async listByKind(kind: LegalDocumentKind): Promise<LegalDocumentVersion[]> {
    await ensureTable();
    const { rows } = await getPool().query<VersionRow>(
      "SELECT * FROM legal_document_versions WHERE kind = $1 ORDER BY version_number DESC",
      [kind]
    );
    return rows.map(toVersion);
  }

  async findById(id: string): Promise<LegalDocumentVersion | null> {
    await ensureTable();
    const { rows } = await getPool().query<VersionRow>("SELECT * FROM legal_document_versions WHERE id = $1", [id]);
    return rows[0] ? toVersion(rows[0]) : null;
  }

  async findPublished(kind: LegalDocumentKind): Promise<LegalDocumentVersion | null> {
    await ensureTable();
    const { rows } = await getPool().query<VersionRow>(
      "SELECT * FROM legal_document_versions WHERE kind = $1 AND status = 'published'",
      [kind]
    );
    return rows[0] ? toVersion(rows[0]) : null;
  }

  async createDraft(kind: LegalDocumentKind, content: LegalDraftContent): Promise<LegalDocumentVersion> {
    return this.transaction(async (client) => {
      // Serialise version numbering per kind for the rest of this transaction.
      await client.query("SELECT pg_advisory_xact_lock(hashtext('legal_document_versions:' || $1))", [kind]);
      const { rows } = await client.query<VersionRow>(
        `INSERT INTO legal_document_versions (id, kind, version_number, title, body, change_note, status)
         SELECT $1, $2, COALESCE(MAX(version_number), 0) + 1, $3, $4, $5, 'draft'
           FROM legal_document_versions WHERE kind = $2
         RETURNING *`,
        [randomUUID(), kind, content.title, content.body, content.changeNote]
      );
      return toVersion(rows[0]);
    });
  }

  async updateDraft(id: string, content: LegalDraftContent): Promise<LegalDocumentVersion | null> {
    await ensureTable();
    const { rows } = await getPool().query<VersionRow>(
      `UPDATE legal_document_versions
          SET title = $2, body = $3, change_note = $4, updated_at = NOW()
        WHERE id = $1 AND status = ANY($5::text[])
        RETURNING *`,
      [id, content.title, content.body, content.changeNote, LegalVersionLifecycle.statusesAllowing("edit")]
    );
    return rows[0] ? toVersion(rows[0]) : null;
  }

  async publish(id: string): Promise<LegalDocumentVersion | null> {
    return this.transaction(async (client) => {
      // Lock the target row so a concurrent edit/delete can't interleave.
      const { rows: target } = await client.query<VersionRow>(
        "SELECT * FROM legal_document_versions WHERE id = $1 AND status = ANY($2::text[]) FOR UPDATE",
        [id, LegalVersionLifecycle.statusesAllowing("publish")]
      );
      if (!target[0]) return null;

      await client.query(
        `UPDATE legal_document_versions
            SET status = 'unpublished', unpublished_at = NOW(), updated_at = NOW()
          WHERE kind = $1 AND status = 'published'`,
        [target[0].kind]
      );
      const { rows } = await client.query<VersionRow>(
        `UPDATE legal_document_versions
            SET status = 'published', published_at = NOW(), unpublished_at = NULL, updated_at = NOW()
          WHERE id = $1
          RETURNING *`,
        [id]
      );
      return toVersion(rows[0]);
    });
  }

  async unpublish(id: string): Promise<LegalDocumentVersion | null> {
    await ensureTable();
    const { rows } = await getPool().query<VersionRow>(
      `UPDATE legal_document_versions
          SET status = 'unpublished', unpublished_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND status = ANY($2::text[])
        RETURNING *`,
      [id, LegalVersionLifecycle.statusesAllowing("unpublish")]
    );
    return rows[0] ? toVersion(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    await ensureTable();
    const { rowCount } = await getPool().query(
      "DELETE FROM legal_document_versions WHERE id = $1 AND status = ANY($2::text[])",
      [id, LegalVersionLifecycle.statusesAllowing("delete")]
    );
    return (rowCount ?? 0) > 0;
  }

  private async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    await ensureTable();
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (e) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw e;
    } finally {
      client.release();
    }
  }
}
