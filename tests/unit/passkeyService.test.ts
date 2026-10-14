import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";
import { PasskeyError, PasskeyService, userHandleFor } from "@/server/auth/passkeys/PasskeyService";
import {
  PasskeyAlreadyExistsError,
  PasskeyRepository,
} from "@/server/repositories/PasskeyRepository";
import type { CreatePasskeyInput, Passkey } from "@/server/domain/entities";
import type { RelyingParty } from "@/server/auth/passkeys/relyingParty";

const webauthn = vi.hoisted(() => ({
  verifyRegistrationResponse: vi.fn(),
  verifyAuthenticationResponse: vi.fn(),
  generateRegistrationOptions: vi.fn(async (opts: unknown) => ({
    challenge: "reg-challenge",
    opts,
  })),
  generateAuthenticationOptions: vi.fn(async (opts: unknown) => ({
    challenge: "auth-challenge",
    opts,
  })),
}));
vi.mock("@simplewebauthn/server", () => webauthn);

class MemoryRepo extends PasskeyRepository {
  items = new Map<string, Passkey>();
  async findById(id: string) {
    return this.items.get(id) ?? null;
  }
  async listByOwner(ownerId: string) {
    return [...this.items.values()].filter((p) => p.ownerId === ownerId);
  }
  async create(input: CreatePasskeyInput) {
    if (this.items.has(input.id)) throw new PasskeyAlreadyExistsError();
    const passkey = { ...input, createdAt: new Date(), lastUsedAt: null };
    this.items.set(input.id, passkey);
    return passkey;
  }
  async recordUse(id: string, counter: number, usedAt: Date) {
    const p = this.items.get(id);
    if (!p || !(counter > p.counter || (counter === 0 && p.counter === 0))) return false;
    this.items.set(id, { ...p, counter, lastUsedAt: usedAt });
    return true;
  }
  async delete(ownerId: string, id: string) {
    return this.items.get(id)?.ownerId === ownerId && this.items.delete(id);
  }
}

const rp: RelyingParty = { id: "example.com", name: "Example", origins: ["https://example.com"] };
const NOW = new Date("2026-10-14T12:00:00Z");

const stored = (overrides: Partial<Passkey> = {}): Passkey => ({
  id: "cred-1",
  ownerId: "admin",
  name: "Laptop",
  publicKey: new Uint8Array([1, 2, 3]),
  counter: 0,
  transports: ["internal"],
  deviceType: "multiDevice",
  backedUp: true,
  aaguid: "aaguid",
  createdAt: NOW,
  lastUsedAt: null,
  ...overrides,
});

const assertion = (userHandle?: string) =>
  ({ id: "cred-1", response: { userHandle } }) as unknown as AuthenticationResponseJSON;

describe("PasskeyService", () => {
  let repo: MemoryRepo;
  let service: PasskeyService;

  beforeEach(() => {
    repo = new MemoryRepo();
    service = new PasskeyService(repo, () => NOW);
    webauthn.verifyAuthenticationResponse.mockReset();
    webauthn.verifyRegistrationResponse.mockReset();
  });

  describe("registration", () => {
    it("requires user verification and excludes passkeys already registered", async () => {
      repo.items.set("cred-1", stored());
      await service.registrationOptions(
        { ownerId: "admin", userName: "me", userDisplayName: "me" },
        rp
      );
      expect(webauthn.generateRegistrationOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          rpID: "example.com",
          excludeCredentials: [{ id: "cred-1", transports: ["internal"] }],
          authenticatorSelection: { residentKey: "required", userVerification: "required" },
        })
      );
    });

    it("stores a verified credential, keeping only known transports", async () => {
      webauthn.verifyRegistrationResponse.mockResolvedValue({
        verified: true,
        registrationInfo: {
          credential: {
            id: "new",
            publicKey: new Uint8Array([9]),
            counter: 0,
            transports: ["usb", "warp-drive"],
          },
          credentialDeviceType: "singleDevice",
          credentialBackedUp: false,
          aaguid: "aaguid",
        },
      });
      const passkey = await service.register(
        "admin",
        "Key",
        {} as RegistrationResponseJSON,
        "challenge",
        rp
      );
      expect(webauthn.verifyRegistrationResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedChallenge: "challenge",
          expectedOrigin: rp.origins,
          expectedRPID: rp.id,
          requireUserVerification: true,
        })
      );
      expect(passkey).toMatchObject({
        id: "new",
        name: "Key",
        transports: ["usb"],
        deviceType: "singleDevice",
      });
    });

    it("reports verification failures and duplicates as PasskeyErrors", async () => {
      webauthn.verifyRegistrationResponse.mockRejectedValueOnce(new Error("Unexpected origin"));
      await expect(
        service.register("admin", "Key", {} as RegistrationResponseJSON, "c", rp)
      ).rejects.toMatchObject({
        code: "verification_failed",
      });

      repo.items.set("cred-1", stored());
      webauthn.verifyRegistrationResponse.mockResolvedValueOnce({
        verified: true,
        registrationInfo: {
          credential: { id: "cred-1", publicKey: new Uint8Array([9]), counter: 0 },
          credentialDeviceType: "multiDevice",
          credentialBackedUp: true,
          aaguid: "aaguid",
        },
      });
      await expect(
        service.register("admin", "Key", {} as RegistrationResponseJSON, "c", rp)
      ).rejects.toMatchObject({
        code: "already_registered",
      });
    });
  });

  describe("sign-in", () => {
    it("asks for user verification", async () => {
      await service.authenticationOptions(rp);
      expect(webauthn.generateAuthenticationOptions).toHaveBeenCalledWith(
        expect.objectContaining({ rpID: "example.com", userVerification: "required" })
      );
    });

    it("signs in with a registered passkey and records its use", async () => {
      repo.items.set("cred-1", stored({ counter: 3 }));
      webauthn.verifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 4 },
      });

      const passkey = await service.authenticate(
        assertion(userHandleFor("admin")),
        "challenge",
        rp
      );

      expect(passkey.ownerId).toBe("admin");
      expect(webauthn.verifyAuthenticationResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          expectedChallenge: "challenge",
          requireUserVerification: true,
          credential: expect.objectContaining({ id: "cred-1", counter: 3 }),
        })
      );
      expect(repo.items.get("cred-1")).toMatchObject({ counter: 4, lastUsedAt: NOW });
    });

    it("rejects unknown credentials without verifying", async () => {
      await expect(service.authenticate(assertion(), "c", rp)).rejects.toMatchObject({
        code: "unknown_credential",
      });
      expect(webauthn.verifyAuthenticationResponse).not.toHaveBeenCalled();
    });

    it("rejects a user handle that belongs to someone else", async () => {
      repo.items.set("cred-1", stored());
      await expect(
        service.authenticate(assertion(userHandleFor("intruder")), "c", rp)
      ).rejects.toBeInstanceOf(PasskeyError);
      expect(webauthn.verifyAuthenticationResponse).not.toHaveBeenCalled();
    });

    it("rejects failed verification", async () => {
      repo.items.set("cred-1", stored());
      webauthn.verifyAuthenticationResponse.mockRejectedValue(new Error("Signature invalid"));
      await expect(service.authenticate(assertion(), "c", rp)).rejects.toMatchObject({
        code: "verification_failed",
      });
      expect(repo.items.get("cred-1")?.lastUsedAt).toBeNull();
    });

    it("rejects a counter that doesn't move forward", async () => {
      repo.items.set("cred-1", stored({ counter: 10 }));
      // e.g. a concurrent sign-in stored a newer counter after this one was verified
      webauthn.verifyAuthenticationResponse.mockResolvedValue({
        verified: true,
        authenticationInfo: { newCounter: 10 },
      });
      await expect(service.authenticate(assertion(), "c", rp)).rejects.toMatchObject({
        code: "counter_rejected",
      });
    });
  });

  it("removes only the owner's passkeys", async () => {
    repo.items.set("cred-1", stored());
    expect(await service.remove("someone-else", "cred-1")).toBe(false);
    expect(await service.remove("admin", "cred-1")).toBe(true);
  });
});
