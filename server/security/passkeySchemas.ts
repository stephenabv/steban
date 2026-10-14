import { z } from "zod";
import { PASSKEY_NAME_MAX_LENGTH } from "@/lib/passkeys/limits";

const base64url = (max: number) =>
  z
    .string()
    .min(1)
    .max(max)
    .regex(/^[A-Za-z0-9_-]+$/);

/** Hard cap on ceremony request bodies; real responses are a few KB. */
export const PASSKEY_BODY_MAX_BYTES = 64 * 1024;

export { PASSKEY_NAME_MAX_LENGTH };

export const passkeyNameSchema = z
  .string()
  .trim()
  .max(PASSKEY_NAME_MAX_LENGTH, `Use ${PASSKEY_NAME_MAX_LENGTH} characters or fewer.`);

const credentialBase = {
  id: base64url(1024),
  rawId: base64url(1024),
  type: z.literal("public-key"),
  clientExtensionResults: z.record(z.string(), z.unknown()).default({}),
  authenticatorAttachment: z.enum(["platform", "cross-platform"]).optional(),
};

/**
 * Shape checks only: bounds sizes and types before the response reaches the
 * WebAuthn library, which performs the cryptographic verification.
 */
export const registrationResponseSchema = z.object({
  ...credentialBase,
  response: z.object({
    clientDataJSON: base64url(8192),
    attestationObject: base64url(32768),
    authenticatorData: base64url(32768).optional(),
    transports: z.array(z.string().max(32)).max(10).optional(),
    publicKeyAlgorithm: z.number().int().optional(),
    publicKey: base64url(8192).optional(),
  }),
});

export const authenticationResponseSchema = z.object({
  ...credentialBase,
  response: z.object({
    clientDataJSON: base64url(8192),
    authenticatorData: base64url(32768),
    signature: base64url(8192),
    userHandle: base64url(1024).optional(),
  }),
});

export const passkeyRegistrationBodySchema = z.object({
  name: passkeyNameSchema.optional(),
  response: registrationResponseSchema,
});

export const passkeySignInBodySchema = z.object({
  response: authenticationResponseSchema,
});
