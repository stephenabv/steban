import type { CreatePasskeyInput, Passkey } from "@/server/domain/entities";

/** Storage contract for admin passkeys (WebAuthn credentials). */
export abstract class PasskeyRepository {
  abstract findById(id: string): Promise<Passkey | null>;
  /** Newest first. */
  abstract listByOwner(ownerId: string): Promise<Passkey[]>;
  /** Throws `PasskeyAlreadyExistsError` when the credential ID is already stored. */
  abstract create(input: CreatePasskeyInput): Promise<Passkey>;
  /**
   * Records a successful sign-in. The counter moves forward only: returns false
   * (and changes nothing) when a concurrent sign-in already stored a counter at
   * or beyond `counter`, which signals a possibly cloned authenticator.
   */
  abstract recordUse(id: string, counter: number, usedAt: Date): Promise<boolean>;
  /** Scoped to the owner so one admin can never remove another's passkey. */
  abstract delete(ownerId: string, id: string): Promise<boolean>;
}

export class PasskeyAlreadyExistsError extends Error {
  constructor() {
    super("This passkey is already registered.");
    this.name = "PasskeyAlreadyExistsError";
  }
}

/** Shared by implementations: a counter of 0 means the authenticator doesn't count. */
export function isCounterAdvance(stored: number, next: number): boolean {
  return (stored === 0 && next === 0) || next > stored;
}
