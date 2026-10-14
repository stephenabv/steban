/** WebAuthn transport hints, stored so later ceremonies can suggest the right authenticator. */
export type PasskeyTransport =
  "ble" | "cable" | "hybrid" | "internal" | "nfc" | "smart-card" | "usb";

/** Whether the credential is bound to one device or synced by a passkey provider. */
export type PasskeyDeviceType = "singleDevice" | "multiDevice";

/** A WebAuthn credential that can sign an admin in. */
export interface Passkey {
  /** Credential ID (base64url), unique per authenticator credential. */
  id: string;
  /** The admin this passkey signs in as. */
  ownerId: string;
  /** Admin-chosen label, e.g. "MacBook Touch ID". */
  name: string;
  /** COSE-encoded public key. */
  publicKey: Uint8Array<ArrayBuffer>;
  /** Signature counter; 0 for authenticators (most synced passkeys) that don't count. */
  counter: number;
  transports: PasskeyTransport[];
  deviceType: PasskeyDeviceType;
  backedUp: boolean;
  /** Authenticator model identifier; all zeros when the authenticator doesn't disclose it. */
  aaguid: string;
  createdAt: Date;
  lastUsedAt: Date | null;
}

export type CreatePasskeyInput = Omit<Passkey, "createdAt" | "lastUsedAt">;
