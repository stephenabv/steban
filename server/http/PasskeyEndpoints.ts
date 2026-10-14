import "server-only";
import { NextResponse } from "next/server";
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from "@simplewebauthn/server";
import { getSession, isSessionSecretConfigured } from "@/server/auth/session";
import { isRecentSignIn, signInAdmin } from "@/server/auth/adminSession";
import {
  PasskeyError,
  consumeChallenge,
  getPasskeyService,
  issueChallenge,
  resolveRelyingParty,
  type PasskeyErrorCode,
} from "@/server/auth/passkeys";
import { AuditService } from "@/server/services/AuditService";
import { rateLimit, rateLimitPolicies } from "@/server/security/rateLimit";
import {
  PASSKEY_BODY_MAX_BYTES,
  passkeyRegistrationBodySchema,
  passkeySignInBodySchema,
} from "@/server/security/passkeySchemas";
import { toPasskeySummary } from "@/lib/passkeys/PasskeySummary";
import { getClientIp, isSameOrigin, readJsonBody } from "./requestGuards";

/** Responses carry one-time challenges; never cache them. */
function json(status: number, body: unknown) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

const SIGN_IN_FAILED =
  "That passkey couldn't sign you in. Try again, or sign in with your password.";
const EXPIRED = "The passkey request expired. Please try again.";

/** Registration responses explain what went wrong; sign-in responses stay generic. */
const REGISTRATION_ERRORS: Record<PasskeyErrorCode, { status: number; message: string }> = {
  verification_failed: {
    status: 400,
    message: "The passkey couldn't be verified. Please try again.",
  },
  unknown_credential: {
    status: 400,
    message: "The passkey couldn't be verified. Please try again.",
  },
  counter_rejected: { status: 400, message: "The passkey couldn't be verified. Please try again." },
  already_registered: { status: 409, message: "This passkey is already registered." },
};

/** Fallback label when the admin doesn't name a new passkey. */
function defaultPasskeyName(now: Date): string {
  return `Passkey added ${now.toISOString().slice(0, 10)}`;
}

/**
 * HTTP surface for passkey sign-in (public) and registration (admin only).
 *
 * Each ceremony is two requests: `*Options` issues a challenge and stores it
 * in the encrypted session cookie, and the follow-up consumes it exactly once.
 * Route Handlers are public HTTP endpoints, so each method checks origin,
 * rate limits and (for registration) the admin session itself.
 */
export class PasskeyEndpoints {
  constructor(private readonly audit = new AuditService()) {}

  /** Step 1 of sign-in: options for `navigator.credentials.get()`. */
  async signInOptions(request: Request): Promise<Response> {
    const rejected = this.guardPublic(request, "options");
    if (rejected) return rejected;

    const rp = resolveRelyingParty(new URL(request.url));
    const options = await getPasskeyService().authenticationOptions(rp);
    const session = await getSession();
    session.webauthnChallenge = issueChallenge(options.challenge, "authentication");
    await session.save();
    return json(200, options);
  }

  /** Step 2 of sign-in: verifies the assertion and starts the admin session. */
  async signIn(request: Request): Promise<Response> {
    const rejected = this.guardPublic(request, "verify");
    if (rejected) return rejected;
    const ip = getClientIp(request);

    const parsed = passkeySignInBodySchema.safeParse(
      await readJsonBody(request, PASSKEY_BODY_MAX_BYTES)
    );
    if (!parsed.success) return json(400, { error: SIGN_IN_FAILED });

    const session = await getSession();
    const challenge = consumeChallenge(session, "authentication");
    await session.save();
    if (!challenge) return json(400, { error: EXPIRED });

    try {
      const passkey = await getPasskeyService().authenticate(
        parsed.data.response as AuthenticationResponseJSON,
        challenge,
        resolveRelyingParty(new URL(request.url))
      );
      signInAdmin(session, passkey.ownerId);
      await session.save();
      await this.audit.log("login", "admin", {
        ip,
        actorId: passkey.ownerId,
        metadata: { success: true, method: "passkey", passkeyId: passkey.id },
      });
      return json(200, { ok: true });
    } catch (e) {
      if (!(e instanceof PasskeyError)) throw e;
      await this.audit.log("login", "admin", {
        ip,
        metadata: { success: false, method: "passkey", reason: e.code },
      });
      return json(401, { error: SIGN_IN_FAILED });
    }
  }

  /** Step 1 of registration: options for `navigator.credentials.create()`. */
  async registrationOptions(request: Request): Promise<Response> {
    const auth = await this.guardAdmin(request);
    if (auth instanceof Response) return auth;
    const { session, ownerId } = auth;

    const userName = process.env.ADMIN_USERNAME || ownerId;
    const options = await getPasskeyService().registrationOptions(
      { ownerId, userName, userDisplayName: userName },
      resolveRelyingParty(new URL(request.url))
    );
    session.webauthnChallenge = issueChallenge(options.challenge, "registration");
    await session.save();
    return json(200, options);
  }

  /** Step 2 of registration: verifies the new credential and stores it. */
  async register(request: Request): Promise<Response> {
    const auth = await this.guardAdmin(request);
    if (auth instanceof Response) return auth;
    const { session, ownerId } = auth;

    const parsed = passkeyRegistrationBodySchema.safeParse(
      await readJsonBody(request, PASSKEY_BODY_MAX_BYTES)
    );
    if (!parsed.success) {
      const nameIssue = parsed.error.issues.find((i) => i.path[0] === "name");
      return json(400, {
        error: nameIssue?.message ?? "The passkey response was invalid. Please try again.",
      });
    }

    const challenge = consumeChallenge(session, "registration");
    await session.save();
    if (!challenge) return json(400, { error: EXPIRED });

    try {
      const passkey = await getPasskeyService().register(
        ownerId,
        parsed.data.name || defaultPasskeyName(new Date()),
        parsed.data.response as RegistrationResponseJSON,
        challenge,
        resolveRelyingParty(new URL(request.url))
      );
      await this.audit.log("create", "passkey", {
        resourceId: passkey.id,
        actorId: ownerId,
        ip: getClientIp(request),
      });
      return json(201, { passkey: toPasskeySummary(passkey) });
    } catch (e) {
      if (!(e instanceof PasskeyError)) throw e;
      const { status, message } = REGISTRATION_ERRORS[e.code];
      return json(status, { error: message });
    }
  }

  private guardPublic(request: Request, step: "options" | "verify"): Response | null {
    if (!isSameOrigin(request)) return json(403, { error: "Forbidden." });
    if (!isSessionSecretConfigured()) {
      return json(500, {
        error: "Server misconfigured: SESSION_SECRET must be at least 32 characters.",
      });
    }
    const limit = rateLimit(
      `admin-passkey-${step}:${getClientIp(request)}`,
      rateLimitPolicies.adminLogin
    );
    if (!limit.allowed)
      return json(429, { error: "Too many sign-in attempts. Please try again later." });
    return null;
  }

  private async guardAdmin(request: Request) {
    const session = await getSession();
    if (!session.isAdmin) return json(401, { error: "Unauthorized." });
    if (!isSameOrigin(request)) return json(403, { error: "Forbidden." });
    if (!isRecentSignIn(session)) {
      return json(403, {
        error: "For your security, sign in again before adding a passkey.",
        code: "reauth_required",
      });
    }
    return { session, ownerId: session.adminId || "admin" };
  }
}
