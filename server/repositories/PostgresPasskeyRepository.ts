import { getPool } from "@/server/db/pool";
import { ensureOnce } from "@/server/db/ensureOnce";
import type {
  CreatePasskeyInput,
  Passkey,
  PasskeyDeviceType,
  PasskeyTransport,
} from "@/server/domain/entities";
import { PasskeyAlreadyExistsError, PasskeyRepository } from "./PasskeyRepository";

interface PasskeyRow {
  id: string;
  owner_id: string;
  name: string;
  public_key: Buffer;
  counter: string | number;
  transports: string[];
  device_type: string;
  backed_up: boolean;
  aaguid: string;
  created_at: string;
  last_used_at: string | null;
}

const COLUMNS =
  "id, owner_id, name, public_key, counter, transports, device_type, backed_up, aaguid, created_at, last_used_at";

/** Postgres unique_violation. */
const UNIQUE_VIOLATION = "23505";

function toPasskey(row: PasskeyRow): Passkey {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    publicKey: new Uint8Array(row.public_key),
    counter: Number(row.counter),
    transports: row.transports as PasskeyTransport[],
    deviceType: row.device_type as PasskeyDeviceType,
    backedUp: row.backed_up,
    aaguid: row.aaguid,
    createdAt: new Date(row.created_at),
    lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : null,
  };
}

const ensureTable = ensureOnce(() =>
  getPool().query(
    `CREATE TABLE IF NOT EXISTS admin_passkeys (
      id           TEXT PRIMARY KEY,
      owner_id     TEXT NOT NULL,
      name         TEXT NOT NULL,
      public_key   BYTEA NOT NULL,
      counter      BIGINT NOT NULL DEFAULT 0,
      transports   TEXT[] NOT NULL DEFAULT '{}',
      device_type  TEXT NOT NULL,
      backed_up    BOOLEAN NOT NULL DEFAULT FALSE,
      aaguid       TEXT NOT NULL,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_used_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_admin_passkeys_owner ON admin_passkeys (owner_id);`
  )
);

export class PostgresPasskeyRepository extends PasskeyRepository {
  async findById(id: string): Promise<Passkey | null> {
    await ensureTable();
    const { rows } = await getPool().query<PasskeyRow>(
      `SELECT ${COLUMNS} FROM admin_passkeys WHERE id = $1`,
      [id]
    );
    return rows[0] ? toPasskey(rows[0]) : null;
  }

  async listByOwner(ownerId: string): Promise<Passkey[]> {
    await ensureTable();
    const { rows } = await getPool().query<PasskeyRow>(
      `SELECT ${COLUMNS} FROM admin_passkeys WHERE owner_id = $1 ORDER BY created_at DESC`,
      [ownerId]
    );
    return rows.map(toPasskey);
  }

  async create(input: CreatePasskeyInput): Promise<Passkey> {
    await ensureTable();
    try {
      const { rows } = await getPool().query<PasskeyRow>(
        `INSERT INTO admin_passkeys (id, owner_id, name, public_key, counter, transports, device_type, backed_up, aaguid)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING ${COLUMNS}`,
        [
          input.id,
          input.ownerId,
          input.name,
          Buffer.from(input.publicKey),
          input.counter,
          input.transports,
          input.deviceType,
          input.backedUp,
          input.aaguid,
        ]
      );
      return toPasskey(rows[0]);
    } catch (e) {
      if ((e as { code?: string }).code === UNIQUE_VIOLATION) throw new PasskeyAlreadyExistsError();
      throw e;
    }
  }

  /** The guard in the WHERE clause makes the forward-only check atomic across instances. */
  async recordUse(id: string, counter: number, usedAt: Date): Promise<boolean> {
    await ensureTable();
    const { rowCount } = await getPool().query(
      `UPDATE admin_passkeys SET counter = $2, last_used_at = $3
       WHERE id = $1 AND ((counter = 0 AND $2 = 0) OR $2 > counter)`,
      [id, counter, usedAt]
    );
    return (rowCount ?? 0) > 0;
  }

  async delete(ownerId: string, id: string): Promise<boolean> {
    await ensureTable();
    const { rowCount } = await getPool().query(
      `DELETE FROM admin_passkeys WHERE id = $1 AND owner_id = $2`,
      [id, ownerId]
    );
    return (rowCount ?? 0) > 0;
  }
}
