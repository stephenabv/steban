import { Pool } from "pg";

let pool: Pool | null = null;

/**
 * Shared pg Pool for the app's lifetime. Provider-agnostic — works with any
 * Postgres connection string (Prisma Postgres, Neon, Supabase, etc.), unlike
 * @vercel/postgres which hard-requires a Neon "-pooler." pooled hostname.
 */
export function getPool(): Pool {
  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL ?? process.env.POSTGRES_URL,
  });
  return pool;
}
