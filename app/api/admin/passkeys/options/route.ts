import { PasskeyEndpoints } from "@/server/http/PasskeyEndpoints";

// pg and the WebAuthn library require the Node.js runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const endpoints = new PasskeyEndpoints();

export function POST(request: Request) {
  return endpoints.registrationOptions(request);
}
