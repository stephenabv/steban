import { Pool } from "pg";
import type { PoolConfig } from "pg";

/**
 * Shared pg Pool, tuned for serverless (Vercel Functions).
 *
 * Provider-agnostic — works with any Postgres connection string (Prisma
 * Postgres, Neon, Supabase, etc.), unlike @vercel/postgres which hard-requires
 * a Neon "-pooler." pooled hostname.
 *
 * Serverless notes:
 *  - Each warm function instance keeps ONE Pool; concurrency across instances is
 *    bounded by `max` (kept small to avoid exhausting the database's connection
 *    slots). If you put an external pooler (PgBouncer / Neon pooled URL) in
 *    front, you can raise PG_POOL_MAX.
 *  - Idle clients are closed quickly so cold instances don't hold slots.
 *  - An `error` handler on idle clients prevents a background disconnect from
 *    crashing the process (pg emits these on the Pool, not the request path).
 */

const isLocalConnection = (url: string | undefined): boolean =>
  !!url && /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url);

function resolveSsl(connectionString: string | undefined): PoolConfig["ssl"] {
  // Explicit opt-out for local / self-managed instances.
  if (process.env.DATABASE_SSL === "disable") return false;
  if (process.env.DATABASE_SSL === "require") return { rejectUnauthorized: false };
  // Local connections don't use TLS; managed providers do.
  if (isLocalConnection(connectionString)) return false;
  // Managed Postgres (Neon/Supabase/Prisma/RDS) terminates TLS with certs that
  // aren't in Node's default trust store, so verification is relaxed here.
  return { rejectUnauthorized: false };
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

  const pool = new Pool({
    connectionString,
    ssl: resolveSsl(connectionString),
    // Keep small: default (10) × N warm instances exhausts managed DB limits.
    max: Number(process.env.PG_POOL_MAX ?? 3),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    keepAlive: true,
    // Recycle connections periodically to avoid stale server-side sessions.
    maxUses: 7_500,
  });

  // Idle-client failures surface here, off the request path. Swallow them so a
  // transient disconnect can't take the whole function instance down.
  pool.on("error", (err) => {
    console.error("[db] idle client error:", err.message);
  });

  return pool;
}

/**
 * Cache the Pool on globalThis so Next.js dev hot-reloads reuse a single Pool
 * instead of leaking a new one on every module refresh.
 */
const globalForPool = globalThis as unknown as { __pgPool?: Pool };

export function getPool(): Pool {
  globalForPool.__pgPool ??= createPool();
  return globalForPool.__pgPool;
}
