import { randomUUID } from "crypto";
import { getPool } from "@/server/db/pool";
import type {
  ContactInfo,
  ContactMessage,
  CreateContactMessageInput,
  UpdateContactInfoInput,
} from "@/server/domain/entities";
import type { Paginated, PaginationParams } from "@/server/domain/types";
import { ContactInfoRepository, ContactMessageRepository } from "./ContactRepository";

/* -------------------------------------------------------------------------- */
/*  Contact messages                                                          */
/* -------------------------------------------------------------------------- */

interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  ip: string | null;
  read: boolean;
  created_at: string;
}

function toMessage(row: ContactMessageRow): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    ip: row.ip ?? undefined,
    read: row.read,
    createdAt: new Date(row.created_at),
  };
}

let messageTableReady: Promise<void> | null = null;

function ensureMessageTable(): Promise<void> {
  messageTableReady ??= getPool()
    .query(
      `CREATE TABLE IF NOT EXISTS contact_messages (
        id         TEXT PRIMARY KEY,
        name       TEXT NOT NULL,
        email      TEXT NOT NULL,
        subject    TEXT NOT NULL,
        message    TEXT NOT NULL,
        ip         TEXT,
        read       BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_contact_messages_read
        ON contact_messages (read, created_at DESC);`
    )
    .then(() => undefined);
  return messageTableReady;
}

/** Production repository for contact messages, backed by standard Postgres. */
export class PostgresContactMessageRepository extends ContactMessageRepository {
  async findById(id: string): Promise<ContactMessage | null> {
    await ensureMessageTable();
    const { rows } = await getPool().query<ContactMessageRow>(
      "SELECT * FROM contact_messages WHERE id = $1",
      [id]
    );
    return rows[0] ? toMessage(rows[0]) : null;
  }

  async findAll(params?: PaginationParams): Promise<Paginated<ContactMessage>> {
    await ensureMessageTable();
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    // Unread first, then newest — the order an inbox expects.
    const { rows } = await getPool().query<ContactMessageRow>(
      `SELECT * FROM contact_messages
       ORDER BY read ASC, created_at DESC
       LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    );
    const { rows: countRows } = await getPool().query<{ count: string }>(
      "SELECT COUNT(*) FROM contact_messages"
    );
    return this.paginate(rows.map(toMessage), Number(countRows[0].count), params);
  }

  async create(input: CreateContactMessageInput): Promise<ContactMessage> {
    await ensureMessageTable();
    const id = randomUUID();
    const { rows } = await getPool().query<ContactMessageRow>(
      `INSERT INTO contact_messages (id, name, email, subject, message, ip)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, input.name, input.email, input.subject, input.message, input.ip ?? null]
    );
    return toMessage(rows[0]);
  }

  async update(id: string, input: { read: boolean }): Promise<ContactMessage | null> {
    await ensureMessageTable();
    const { rows } = await getPool().query<ContactMessageRow>(
      "UPDATE contact_messages SET read = $1 WHERE id = $2 RETURNING *",
      [input.read, id]
    );
    return rows[0] ? toMessage(rows[0]) : null;
  }

  async markAsRead(id: string): Promise<boolean> {
    await ensureMessageTable();
    const { rowCount } = await getPool().query(
      "UPDATE contact_messages SET read = TRUE WHERE id = $1",
      [id]
    );
    return (rowCount ?? 0) > 0;
  }

  async delete(id: string): Promise<boolean> {
    await ensureMessageTable();
    const { rowCount } = await getPool().query("DELETE FROM contact_messages WHERE id = $1", [id]);
    return (rowCount ?? 0) > 0;
  }
}

/* -------------------------------------------------------------------------- */
/*  Contact info (single-row settings)                                        */
/* -------------------------------------------------------------------------- */

interface ContactInfoRow {
  id: string;
  email: string;
  github_url: string;
  linkedin_url: string;
  facebook_url: string;
  resume_url: string;
  updated_at: string;
}

function toContactInfo(row: ContactInfoRow): ContactInfo {
  return {
    id: row.id,
    email: row.email,
    githubUrl: row.github_url,
    linkedinUrl: row.linkedin_url,
    facebookUrl: row.facebook_url,
    resumeUrl: row.resume_url,
    updatedAt: new Date(row.updated_at),
  };
}

let infoTableReady: Promise<void> | null = null;

function ensureInfoTable(): Promise<void> {
  infoTableReady ??= getPool()
    .query(
      `CREATE TABLE IF NOT EXISTS contact_info (
        id           TEXT PRIMARY KEY,
        email        TEXT NOT NULL DEFAULT '',
        github_url   TEXT NOT NULL DEFAULT '',
        linkedin_url TEXT NOT NULL DEFAULT '',
        facebook_url TEXT NOT NULL DEFAULT '',
        resume_url   TEXT NOT NULL DEFAULT '',
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`
    )
    .then(() => undefined);
  return infoTableReady;
}

/** Production repository for the single contact-info settings row. */
export class PostgresContactInfoRepository extends ContactInfoRepository {
  async getContactInfo(): Promise<ContactInfo | null> {
    await ensureInfoTable();
    const { rows } = await getPool().query<ContactInfoRow>(
      "SELECT * FROM contact_info ORDER BY updated_at DESC LIMIT 1"
    );
    return rows[0] ? toContactInfo(rows[0]) : null;
  }

  async findById(id: string): Promise<ContactInfo | null> {
    await ensureInfoTable();
    const { rows } = await getPool().query<ContactInfoRow>(
      "SELECT * FROM contact_info WHERE id = $1",
      [id]
    );
    return rows[0] ? toContactInfo(rows[0]) : null;
  }

  async update(id: string, input: UpdateContactInfoInput): Promise<ContactInfo | null> {
    await ensureInfoTable();
    const existing = await this.findById(id);
    if (!existing) return null;
    const merged = { ...existing, ...input };
    const { rows } = await getPool().query<ContactInfoRow>(
      `UPDATE contact_info SET
        email = $1,
        github_url = $2,
        linkedin_url = $3,
        facebook_url = $4,
        resume_url = $5,
        updated_at = NOW()
      WHERE id = $6
      RETURNING *`,
      [merged.email, merged.githubUrl, merged.linkedinUrl, merged.facebookUrl, merged.resumeUrl, id]
    );
    return rows[0] ? toContactInfo(rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    await ensureInfoTable();
    const { rowCount } = await getPool().query("DELETE FROM contact_info WHERE id = $1", [id]);
    return (rowCount ?? 0) > 0;
  }
}
