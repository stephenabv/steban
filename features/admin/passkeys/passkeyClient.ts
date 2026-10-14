import { startAuthentication, startRegistration, WebAuthnError } from "@simplewebauthn/browser";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";
import type { PasskeySummary } from "@/lib/passkeys/PasskeySummary";

export type PasskeyOutcome<T> =
  | { status: "ok"; value: T }
  /** The admin dismissed the browser prompt; not an error worth showing. */
  | { status: "cancelled" }
  /** The server wants a fresh sign-in before enrolling a passkey. */
  | { status: "reauth_required"; error: string }
  | { status: "error"; error: string };

interface ApiError {
  error?: string;
  code?: string;
}

class PasskeyRequestError extends Error {
  constructor(
    message: string,
    readonly code?: string
  ) {
    super(message);
  }
}

async function postJson<T>(url: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new PasskeyRequestError("Network error. Please try again.");
  }
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new PasskeyRequestError(`Server error (${res.status}). Please try again.`);
  }
  if (!res.ok) {
    const { error, code } = data as ApiError;
    throw new PasskeyRequestError(error ?? "Something went wrong. Please try again.", code);
  }
  return data as T;
}

/** Maps browser and server failures to an outcome the UI can render. */
function toOutcome(e: unknown): PasskeyOutcome<never> {
  if (e instanceof PasskeyRequestError) {
    return e.code === "reauth_required"
      ? { status: "reauth_required", error: e.message }
      : { status: "error", error: e.message };
  }
  // NotAllowedError covers both "user cancelled" and "timed out"; neither needs an alarming message.
  if (
    (e instanceof WebAuthnError && e.code === "ERROR_CEREMONY_ABORTED") ||
    (e as Error)?.name === "NotAllowedError"
  ) {
    return { status: "cancelled" };
  }
  if (e instanceof WebAuthnError && e.code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED") {
    return { status: "error", error: "This device already has a passkey for this site." };
  }
  return {
    status: "error",
    error: "Your browser couldn't complete the passkey request. Please try again.",
  };
}

/** Runs the sign-in ceremony. On success the admin session cookie is set. */
export async function signInWithPasskey(): Promise<PasskeyOutcome<void>> {
  try {
    const optionsJSON = await postJson<PublicKeyCredentialRequestOptionsJSON>(
      "/api/auth/passkey/options"
    );
    const response = await startAuthentication({ optionsJSON });
    await postJson("/api/auth/passkey/verify", { response });
    return { status: "ok", value: undefined };
  } catch (e) {
    return toOutcome(e);
  }
}

/** Runs the registration ceremony for the signed-in admin. */
export async function registerPasskey(name: string): Promise<PasskeyOutcome<PasskeySummary>> {
  try {
    const optionsJSON = await postJson<PublicKeyCredentialCreationOptionsJSON>(
      "/api/admin/passkeys/options"
    );
    const response = await startRegistration({ optionsJSON });
    const { passkey } = await postJson<{ passkey: PasskeySummary }>("/api/admin/passkeys", {
      name: name.trim() || undefined,
      response,
    });
    return { status: "ok", value: passkey };
  } catch (e) {
    return toOutcome(e);
  }
}
