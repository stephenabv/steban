import type { Passkey } from "@/server/domain/entities";

/** Serialisable passkey details for the admin UI; never includes key material. */
export interface PasskeySummary {
  id: string;
  name: string;
  /** "multiDevice" passkeys are synced by a provider such as iCloud Keychain or Google Password Manager. */
  synced: boolean;
  /** ISO 8601 timestamps. */
  createdAt: string;
  lastUsedAt: string | null;
}

export function toPasskeySummary(passkey: Passkey): PasskeySummary {
  return {
    id: passkey.id,
    name: passkey.name,
    synced: passkey.deviceType === "multiDevice",
    createdAt: passkey.createdAt.toISOString(),
    lastUsedAt: passkey.lastUsedAt?.toISOString() ?? null,
  };
}
