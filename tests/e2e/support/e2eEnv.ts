import { randomBytes, scryptSync } from "node:crypto";
import path from "node:path";

export const E2E_PORT = 3100;
export const STORAGE_STATE = path.join(__dirname, "..", ".auth", "admin.json");

/**
 * Throwaway credentials for the local test server only. Generated once in the
 * runner process; workers inherit them through the environment.
 */
process.env.E2E_ADMIN_PASSWORD ||= randomBytes(18).toString("base64url");

export const E2E_ADMIN = {
  username: "e2e-admin",
  password: process.env.E2E_ADMIN_PASSWORD,
};

/** Same `salt:key` scrypt format as server/security/crypto.ts. */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

/**
 * Environment for the test server. Database URLs are blanked so the app uses
 * the JSON store, and the AI generator is off so no external calls are made.
 */
export const E2E_ENV: Record<string, string> = {
  ADMIN_USERNAME: E2E_ADMIN.username,
  ADMIN_PASSWORD_HASH: hashPassword(E2E_ADMIN.password),
  SESSION_SECRET: randomBytes(32).toString("hex"),
  DATABASE_URL: "",
  POSTGRES_URL: "",
  sudo_route: "",
  COVER_LETTER_AI_ENABLED: "false",
};
