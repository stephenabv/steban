import { describe, expect, it } from "vitest";
import {
  CHALLENGE_TTL_MS,
  consumeChallenge,
  issueChallenge,
} from "@/server/auth/passkeys/challenge";
import { RECENT_SIGN_IN_WINDOW_MS, isRecentSignIn, signInAdmin } from "@/server/auth/adminSession";
import { resolveRelyingParty } from "@/server/auth/passkeys/relyingParty";
import type { SessionData } from "@/server/auth/session";

const NOW = 1_800_000_000_000;

describe("WebAuthn challenges", () => {
  it("is accepted once for its own purpose", () => {
    const session: SessionData = {
      isAdmin: false,
      webauthnChallenge: issueChallenge("abc", "authentication", NOW),
    };
    expect(consumeChallenge(session, "authentication", NOW + 1000)).toBe("abc");
    expect(consumeChallenge(session, "authentication", NOW + 1000)).toBeNull();
  });

  it("is rejected and cleared when used for another ceremony", () => {
    const session: SessionData = {
      isAdmin: true,
      webauthnChallenge: issueChallenge("abc", "authentication", NOW),
    };
    expect(consumeChallenge(session, "registration", NOW)).toBeNull();
    expect(session.webauthnChallenge).toBeUndefined();
  });

  it("expires", () => {
    const session: SessionData = {
      isAdmin: false,
      webauthnChallenge: issueChallenge("abc", "authentication", NOW),
    };
    expect(consumeChallenge(session, "authentication", NOW + CHALLENGE_TTL_MS + 1)).toBeNull();
  });
});

describe("admin sign-in", () => {
  it("records the sign-in time and drops any pending ceremony", () => {
    const session: SessionData = {
      isAdmin: false,
      webauthnChallenge: issueChallenge("abc", "authentication", NOW),
    };
    signInAdmin(session, "admin", NOW);
    expect(session).toEqual({ isAdmin: true, adminId: "admin", authenticatedAt: NOW });
  });

  it("treats only sign-ins inside the window as recent", () => {
    expect(
      isRecentSignIn({ isAdmin: true, authenticatedAt: NOW }, NOW + RECENT_SIGN_IN_WINDOW_MS)
    ).toBe(true);
    expect(
      isRecentSignIn({ isAdmin: true, authenticatedAt: NOW }, NOW + RECENT_SIGN_IN_WINDOW_MS + 1)
    ).toBe(false);
    // Sessions created before sign-in times were recorded.
    expect(isRecentSignIn({ isAdmin: true }, NOW)).toBe(false);
    // A timestamp in the future is never trusted.
    expect(isRecentSignIn({ isAdmin: true, authenticatedAt: NOW + 60_000 }, NOW)).toBe(false);
  });
});

describe("resolveRelyingParty", () => {
  it("uses the request origin by default", () => {
    expect(
      resolveRelyingParty(
        new URL("https://steban.vercel.app/api/auth/passkey/options"),
        {} as NodeJS.ProcessEnv
      )
    ).toMatchObject({
      id: "steban.vercel.app",
      origins: ["https://steban.vercel.app"],
    });
    expect(
      resolveRelyingParty(new URL("http://localhost:3100/x"), {} as NodeJS.ProcessEnv)
    ).toMatchObject({
      id: "localhost",
      origins: ["http://localhost:3100"],
    });
  });

  it("prefers explicit configuration", () => {
    const env = {
      WEBAUTHN_RP_ID: "example.com",
      WEBAUTHN_ORIGINS: "https://example.com/, https://admin.example.com",
    } as unknown as NodeJS.ProcessEnv;
    expect(resolveRelyingParty(new URL("https://preview.vercel.app/"), env)).toMatchObject({
      id: "example.com",
      origins: ["https://example.com", "https://admin.example.com"],
    });
    expect(
      resolveRelyingParty(new URL("https://x.test/"), {
        WEBAUTHN_RP_ID: "example.com",
      } as unknown as NodeJS.ProcessEnv).origins
    ).toEqual(["https://example.com"]);
  });
});
