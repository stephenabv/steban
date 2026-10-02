import { randomUUID } from "crypto";
import type { PoolClient } from "pg";
import { getPool } from "@/server/db/pool";
import { ensureOnce } from "@/server/db/ensureOnce";
import type {
  CoverLetterSections,
  CoverLetterStatus,
  GeneratorStrategy,
  LetterLength,
  LetterTone,
  MatchReport,
  WorkArrangement,
} from "@/server/domain/coverLetter";
import type {
  CoverLetterPatch,
  CoverLetterRecord,
  CoverLetterSummary,
  NewCoverLetter,
} from "./CoverLetterRepository";
import { COVER_LETTER_LIST_LIMIT, CoverLetterRepository } from "./CoverLetterRepository";

interface RecordRow {
  id: string;
  owner_id: string;
  application_id: string;
  generator: GeneratorStrategy;
  status: CoverLetterStatus;
  sections: CoverLetterSections;
  plain_text: string;
  match_report: MatchReport;
  created_at: Date;
  updated_at: Date;
  company_name: string;
  company_location: string | null;
  hiring_manager: string;
  position_title: string;
  work_arrangement: WorkArrangement;
  job_description: string;
  industry_context: string | null;
  posting_url: string | null;
  letter_date: string;
  tone: LetterTone;
  length: LetterLength;
  application_created_at: Date;
  application_updated_at: Date;
}

type SummaryRow = Pick<
  RecordRow,
  | "id"
  | "status"
  | "generator"
  | "company_name"
  | "position_title"
  | "letter_date"
  | "created_at"
  | "updated_at"
>;

const nullable = (value: string | null): string | undefined => value ?? undefined;

function toRecord(row: RecordRow): CoverLetterRecord {
  return {
    letter: {
      id: row.id,
      ownerId: row.owner_id,
      applicationId: row.application_id,
      generator: row.generator,
      status: row.status,
      sections: row.sections,
      plainText: row.plain_text,
      matchReport: row.match_report,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    },
    application: {
      id: row.application_id,
      ownerId: row.owner_id,
      companyName: row.company_name,
      companyLocation: nullable(row.company_location),
      hiringManager: row.hiring_manager,
      positionTitle: row.position_title,
      workArrangement: row.work_arrangement,
      jobDescription: row.job_description,
      industryContext: nullable(row.industry_context),
      postingUrl: nullable(row.posting_url),
      letterDate: row.letter_date,
      tone: row.tone,
      length: row.length,
      createdAt: new Date(row.application_created_at),
      updatedAt: new Date(row.application_updated_at),
    },
  };
}

const ensureTables = ensureOnce(() =>
  getPool().query(
    `CREATE TABLE IF NOT EXISTS job_applications (
        id                TEXT PRIMARY KEY,
        owner_id          TEXT NOT NULL,
        company_name      TEXT NOT NULL,
        company_location  TEXT,
        hiring_manager    TEXT NOT NULL DEFAULT 'Hiring Manager',
        position_title    TEXT NOT NULL,
        work_arrangement  JSONB NOT NULL,
        job_description   TEXT NOT NULL,
        industry_context  TEXT,
        posting_url       TEXT,
        letter_date       DATE NOT NULL,
        tone              TEXT NOT NULL CHECK (tone IN ('professional', 'warm')),
        length            TEXT NOT NULL CHECK (length IN ('concise', 'standard')),
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS cover_letters (
        id              TEXT PRIMARY KEY,
        owner_id        TEXT NOT NULL,
        application_id  TEXT NOT NULL REFERENCES job_applications (id) ON DELETE CASCADE,
        generator       TEXT NOT NULL CHECK (generator IN ('template', 'ai')),
        status          TEXT NOT NULL CHECK (status IN ('draft', 'final')),
        sections        JSONB NOT NULL,
        plain_text      TEXT NOT NULL,
        match_report    JSONB NOT NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_cover_letters_owner
        ON cover_letters (owner_id, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_job_applications_owner
        ON job_applications (owner_id);`
  )
);

const RECORD_SELECT = `
  SELECT l.id, l.owner_id, l.application_id, l.generator, l.status, l.sections,
         l.plain_text, l.match_report, l.created_at, l.updated_at,
         a.company_name, a.company_location, a.hiring_manager, a.position_title,
         a.work_arrangement, a.job_description, a.industry_context, a.posting_url,
         a.letter_date::text AS letter_date, a.tone, a.length,
         a.created_at AS application_created_at, a.updated_at AS application_updated_at
    FROM cover_letters l
    JOIN job_applications a ON a.id = l.application_id AND a.owner_id = l.owner_id`;

/** Production repository in the site's Postgres database. Parameterized SQL only. */
export class PostgresCoverLetterRepository extends CoverLetterRepository {
  async create(
    ownerId: string,
    { application, content }: NewCoverLetter
  ): Promise<CoverLetterRecord> {
    await ensureTables();
    const applicationId = randomUUID();
    const letterId = randomUUID();
    await this.transaction(async (client) => {
      await client.query(
        `INSERT INTO job_applications (id, owner_id, company_name, company_location, hiring_manager,
           position_title, work_arrangement, job_description, industry_context, posting_url,
           letter_date, tone, length)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          applicationId,
          ownerId,
          application.companyName,
          application.companyLocation ?? null,
          application.hiringManager,
          application.positionTitle,
          JSON.stringify(application.workArrangement),
          application.jobDescription,
          application.industryContext ?? null,
          application.postingUrl ?? null,
          application.letterDate,
          application.tone,
          application.length,
        ]
      );
      await client.query(
        `INSERT INTO cover_letters (id, owner_id, application_id, generator, status, sections,
           plain_text, match_report)
         VALUES ($1, $2, $3, $4, 'draft', $5, $6, $7)`,
        [
          letterId,
          ownerId,
          applicationId,
          content.generator,
          JSON.stringify(content.sections),
          content.plainText,
          JSON.stringify(content.matchReport),
        ]
      );
    });
    return (await this.findById(ownerId, letterId)) as CoverLetterRecord;
  }

  async findById(ownerId: string, id: string): Promise<CoverLetterRecord | null> {
    await ensureTables();
    const { rows } = await getPool().query<RecordRow>(
      `${RECORD_SELECT} WHERE l.id = $1 AND l.owner_id = $2`,
      [id, ownerId]
    );
    return rows[0] ? toRecord(rows[0]) : null;
  }

  async list(ownerId: string): Promise<CoverLetterSummary[]> {
    await ensureTables();
    // Summary columns only: the job description and letter text stay in the database.
    const { rows } = await getPool().query<SummaryRow>(
      `SELECT l.id, l.status, l.generator, a.company_name, a.position_title,
              a.letter_date::text AS letter_date, l.created_at, l.updated_at
         FROM cover_letters l
         JOIN job_applications a ON a.id = l.application_id AND a.owner_id = l.owner_id
        WHERE l.owner_id = $1
        ORDER BY l.updated_at DESC
        LIMIT $2`,
      [ownerId, COVER_LETTER_LIST_LIMIT]
    );
    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      generator: row.generator,
      companyName: row.company_name,
      positionTitle: row.position_title,
      letterDate: row.letter_date,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  async update(
    ownerId: string,
    id: string,
    patch: CoverLetterPatch,
    allowedStatuses: readonly CoverLetterStatus[]
  ): Promise<CoverLetterRecord | null> {
    await ensureTables();
    const applied = await this.transaction(async (client) => {
      const { content, status, application } = patch;
      const { rows } = await client.query<{ application_id: string }>(
        `UPDATE cover_letters SET
           generator    = COALESCE($4, generator),
           sections     = COALESCE($5::jsonb, sections),
           plain_text   = COALESCE($6, plain_text),
           match_report = COALESCE($7::jsonb, match_report),
           status       = COALESCE($8, status),
           updated_at   = NOW()
         WHERE id = $1 AND owner_id = $2 AND status = ANY($3::text[])
         RETURNING application_id`,
        [
          id,
          ownerId,
          [...allowedStatuses],
          content?.generator ?? null,
          content?.sections ? JSON.stringify(content.sections) : null,
          content?.plainText ?? null,
          content?.matchReport ? JSON.stringify(content.matchReport) : null,
          status ?? null,
        ]
      );
      if (!rows[0]) return false;
      if (application) {
        await client.query(
          `UPDATE job_applications SET
             tone = COALESCE($3, tone),
             length = COALESCE($4, length),
             updated_at = NOW()
           WHERE id = $1 AND owner_id = $2`,
          [rows[0].application_id, ownerId, application.tone ?? null, application.length ?? null]
        );
      }
      return true;
    });
    return applied ? this.findById(ownerId, id) : null;
  }

  async delete(ownerId: string, id: string): Promise<boolean> {
    await ensureTables();
    // Deleting the application cascades to its letter.
    const { rowCount } = await getPool().query(
      `DELETE FROM job_applications
        WHERE owner_id = $2
          AND id = (SELECT application_id FROM cover_letters WHERE id = $1 AND owner_id = $2)`,
      [id, ownerId]
    );
    return (rowCount ?? 0) > 0;
  }

  private async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      const result = await work(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
