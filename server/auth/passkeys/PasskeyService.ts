import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import type { Passkey, PasskeyTransport } from "@/server/domain/entities";
import {
  PasskeyAlreadyExistsError,
  type PasskeyRepository,
} from "@/server/repositories/PasskeyRepository";
import type { RelyingParty } from "./relyingParty";

export type PasskeyErrorCode =
  /** The browser's response didn't verify (wrong origin, bad signature, expired challenge…). */
  | "verification_failed"
  /** No stored passkey matches the credential the browser used. */
  | "unknown_credential"
  | "already_registered"
  /** The signature counter went backwards: the authenticator may have been cloned. */
  | "counter_rejected";

export class PasskeyError extends Error {
  constructor(
    readonly code: PasskeyErrorCode,
    message: string
  ) {
    super(message);
    this.name = "PasskeyError";
  }
}

export interface PasskeyOwner {
  ownerId: string;
  /** Shown in the browser's passkey picker. */
  userName: string;
  userDisplayName: string;
}

const CEREMONY_TIMEOUT_MS = 60_000;
const KNOWN_TRANSPORTS: ReadonlySet<string> = new Set<PasskeyTransport>([
  "ble",
  "cable",
  "hybrid",
  "internal",
  "nfc",
  "smart-card",
  "usb",
]);

/** The WebAuthn user handle: a stable, opaque per-admin identifier. */
export function userHandleFor(ownerId: string): string {
  return Buffer.from(ownerId, "utf-8").toString("base64url");
}

/**
 * Registers passkeys for the admin and signs the admin in with them.
 *
 * Every ceremony requires user verification (biometric or device PIN), so a
 * passkey is a complete second factor on its own. Sign-in is usernameless:
 * the browser offers the discoverable passkeys it has for this site.
 */
export class PasskeyService {
  constructor(
    private readonly repo: PasskeyRepository,
    private readonly clock: () => Date = () => new Date()
  ) {}

  list(ownerId: string): Promise<Passkey[]> {
    return this.repo.listByOwner(ownerId);
  }

  remove(ownerId: string, id: string): Promise<boolean> {
    return this.repo.delete(ownerId, id);
  }

  async registrationOptions(
    owner: PasskeyOwner,
    rp: RelyingParty
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    const existing = await this.repo.listByOwner(owner.ownerId);
    return generateRegistrationOptions({
      rpName: rp.name,
      rpID: rp.id,
      userName: owner.userName,
      userDisplayName: owner.userDisplayName,
      userID: new Uint8Array(Buffer.from(owner.ownerId, "utf-8")),
      timeout: CEREMONY_TIMEOUT_MS,
      attestationType: "none",
      // Stops the same authenticator from being registered twice.
      excludeCredentials: existing.map((p) => ({ id: p.id, transports: p.transports })),
      authenticatorSelection: { residentKey: "required", userVerification: "required" },
    });
  }

  async register(
    ownerId: string,
    name: string,
    response: RegistrationResponseJSON,
    expectedChallenge: string,
    rp: RelyingParty
  ): Promise<Passkey> {
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge,
        expectedOrigin: rp.origins,
        expectedRPID: rp.id,
        requireUserVerification: true,
      });
    } catch {
      throw new PasskeyError("verification_failed", "The passkey couldn't be verified.");
    }
    if (!verification.verified) {
      throw new PasskeyError("verification_failed", "The passkey couldn't be verified.");
    }

    const { credential, credentialDeviceType, credentialBackedUp, aaguid } =
      verification.registrationInfo;
    try {
      return await this.repo.create({
        id: credential.id,
        ownerId,
        name,
        publicKey: credential.publicKey,
        counter: credential.counter,
        transports: (credential.transports ?? []).filter((t): t is PasskeyTransport =>
          KNOWN_TRANSPORTS.has(t)
        ),
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        aaguid,
      });
    } catch (e) {
      if (e instanceof PasskeyAlreadyExistsError) {
        throw new PasskeyError("already_registered", e.message);
      }
      throw e;
    }
  }

  authenticationOptions(rp: RelyingParty): Promise<PublicKeyCredentialRequestOptionsJSON> {
    return generateAuthenticationOptions({
      rpID: rp.id,
      timeout: CEREMONY_TIMEOUT_MS,
      userVerification: "required",
    });
  }

  /** Returns the passkey that signed in. Throws `PasskeyError` for any rejection. */
  async authenticate(
    response: AuthenticationResponseJSON,
    expectedChallenge: string,
    rp: RelyingParty
  ): Promise<Passkey> {
    const passkey = await this.repo.findById(response.id);
    if (!passkey) {
      throw new PasskeyError("unknown_credential", "This passkey isn't registered for this site.");
    }

    // The authenticator reports which user the discoverable credential belongs to.
    const userHandle = response.response.userHandle;
    if (userHandle && userHandle !== userHandleFor(passkey.ownerId)) {
      throw new PasskeyError("verification_failed", "The passkey couldn't be verified.");
    }

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge,
        expectedOrigin: rp.origins,
        expectedRPID: rp.id,
        credential: {
          id: passkey.id,
          publicKey: passkey.publicKey,
          counter: passkey.counter,
          transports: passkey.transports,
        },
        requireUserVerification: true,
      });
    } catch {
      throw new PasskeyError("verification_failed", "The passkey couldn't be verified.");
    }
    if (!verification.verified) {
      throw new PasskeyError("verification_failed", "The passkey couldn't be verified.");
    }

    const usedAt = this.clock();
    const { newCounter } = verification.authenticationInfo;
    if (!(await this.repo.recordUse(passkey.id, newCounter, usedAt))) {
      throw new PasskeyError("counter_rejected", "The passkey couldn't be verified.");
    }
    return { ...passkey, counter: newCounter, lastUsedAt: usedAt };
  }
}
