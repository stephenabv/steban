import { siteConfig } from "@/config/site";

/** The WebAuthn relying party (this site) that passkeys are scoped to. */
export interface RelyingParty {
  /** Registrable domain passkeys are bound to, e.g. "stephenabueva.dev". */
  id: string;
  name: string;
  /** Origins allowed to run ceremonies, e.g. "https://stephenabueva.dev". */
  origins: string[];
}

function parseOrigins(raw: string): string[] {
  return raw
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
    .map((o) => new URL(o).origin);
}

/**
 * `WEBAUTHN_RP_ID` / `WEBAUTHN_ORIGINS` pin the relying party explicitly (e.g.
 * to share passkeys across subdomains). Otherwise it is the origin serving the
 * request. That is safe to derive from the request: the browser writes the
 * origin into the signed client data and the authenticator binds credentials
 * to the RP ID, so a forged Host header cannot make a foreign assertion verify.
 */
export function resolveRelyingParty(
  requestUrl: URL,
  env: NodeJS.ProcessEnv = process.env
): RelyingParty {
  const configuredId = env.WEBAUTHN_RP_ID?.trim();
  const configuredOrigins = env.WEBAUTHN_ORIGINS?.trim();
  if (configuredId) {
    const origins = configuredOrigins
      ? parseOrigins(configuredOrigins)
      : [`https://${configuredId}`];
    return { id: configuredId, name: siteConfig.name, origins };
  }
  return { id: requestUrl.hostname, name: siteConfig.name, origins: [requestUrl.origin] };
}
