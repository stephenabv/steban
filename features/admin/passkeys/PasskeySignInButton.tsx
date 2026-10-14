"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { signInWithPasskey } from "./passkeyClient";
import { usePasskeySupport } from "./usePasskeySupport";

interface Props {
  /** Called after the session is established. */
  onSignedIn: () => void;
  onError: (message: string | null) => void;
  disabled?: boolean;
}

/** Usernameless sign-in: the browser offers the passkeys it has for this site. */
export function PasskeySignInButton({ onSignedIn, onError, disabled }: Props) {
  const supported = usePasskeySupport();
  const [pending, setPending] = useState(false);

  if (!supported) return null;

  async function onClick() {
    onError(null);
    setPending(true);
    const outcome = await signInWithPasskey();
    if (outcome.status === "ok") {
      onSignedIn();
      return;
    }
    setPending(false);
    if (outcome.status !== "cancelled") onError(outcome.error);
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      icon="key"
      fullWidth
      onClick={() => void onClick()}
      loading={pending}
      loadingText="Waiting for your passkey…"
      disabled={disabled}
    >
      Sign in with a passkey
    </Button>
  );
}
