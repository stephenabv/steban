"use client";

import { useSyncExternalStore } from "react";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";

const subscribe = () => () => {};

/** `null` during server rendering and hydration, so both renders match. */
export function usePasskeySupport(): boolean | null {
  return useSyncExternalStore<boolean | null>(subscribe, browserSupportsWebAuthn, () => null);
}
