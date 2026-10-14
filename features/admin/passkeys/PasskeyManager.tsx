"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PasskeySummary } from "@/lib/passkeys/PasskeySummary";
import { PASSKEY_NAME_MAX_LENGTH } from "@/lib/passkeys/limits";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input } from "@/components/ui/Field";
import { Icon } from "@/components/icons/Icon";
import { useToast } from "@/components/ui/ToastProvider";
import { deletePasskeyAction } from "../passkeyActions";
import { registerPasskey } from "./passkeyClient";
import { usePasskeySupport } from "./usePasskeySupport";
import styles from "./PasskeyManager.module.less";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

interface Props {
  passkeys: PasskeySummary[];
  basePath: string;
}

export function PasskeyManager({ passkeys, basePath }: Props) {
  const router = useRouter();
  const toast = useToast();
  const supported = usePasskeySupport();
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<PasskeySummary | null>(null);
  const [removing, setRemoving] = useState(false);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAdding(true);
    const outcome = await registerPasskey(name);
    setAdding(false);
    switch (outcome.status) {
      case "ok":
        setName("");
        toast.success(`“${outcome.value.name}” added. You can use it the next time you sign in.`);
        router.refresh();
        break;
      case "reauth_required":
        setNeedsReauth(true);
        break;
      case "error":
        setAddError(outcome.error);
        break;
      case "cancelled":
        break;
    }
  }

  async function signInAgain() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      const callbackUrl = encodeURIComponent(`${basePath}/passkeys`);
      router.push(`${basePath}/login?callbackUrl=${callbackUrl}`);
      router.refresh();
    }
  }

  async function confirmRemove() {
    if (!pendingRemoval) return;
    setRemoving(true);
    const result = await deletePasskeyAction(pendingRemoval.id);
    setRemoving(false);
    if (!result.ok) {
      toast.error(result.error ?? "Couldn't remove the passkey.");
      return;
    }
    toast.success(`“${pendingRemoval.name}” removed.`);
    setPendingRemoval(null);
    router.refresh();
  }

  return (
    <div className={styles.stack}>
      <Card padding="lg">
        <CardHeader
          title="Add a passkey"
          description="Your browser asks you to confirm with Face ID, Touch ID, Windows Hello, your device PIN or a security key. Your password keeps working."
        />
        {supported === false ? (
          <Alert tone="warning" title="This browser doesn't support passkeys">
            Open the dashboard in an up-to-date browser such as Chrome, Safari, Edge or Firefox to
            add one.
          </Alert>
        ) : needsReauth ? (
          <Alert tone="info" title="Sign in again to add a passkey">
            <p>For your security, adding a passkey needs a sign-in from the last 10 minutes.</p>
            <Button className={styles.alertAction} icon="logout" onClick={() => void signInAgain()}>
              Sign in again
            </Button>
          </Alert>
        ) : (
          <form className={styles.addForm} onSubmit={onAdd} aria-label="Add a passkey">
            {addError && <Alert tone="danger">{addError}</Alert>}
            <Field
              label="Name"
              id="passkey-name"
              optional
              hint="Helps you tell your passkeys apart later."
              count={{ value: name.length, max: PASSKEY_NAME_MAX_LENGTH }}
            >
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={PASSKEY_NAME_MAX_LENGTH}
                placeholder="e.g. MacBook Touch ID"
                autoComplete="off"
              />
            </Field>
            <div className={styles.addActions}>
              <Button
                type="submit"
                icon="plus"
                loading={adding}
                loadingText="Waiting for your passkey…"
                disabled={supported === null}
              >
                Add passkey
              </Button>
            </div>
          </form>
        )}
      </Card>

      <Card padding="lg">
        <CardHeader
          title="Your passkeys"
          description="Each one can sign in to this dashboard. Remove any you no longer use."
          actions={
            <Badge tone={passkeys.length > 0 ? "success" : "neutral"} dot>
              {passkeys.length === 1 ? "1 passkey" : `${passkeys.length} passkeys`}
            </Badge>
          }
        />
        {passkeys.length === 0 ? (
          <EmptyState
            compact
            icon="key"
            title="No passkeys yet"
            description="Add one above to sign in without typing your password."
          />
        ) : (
          <ul role="list" className={styles.list} aria-label="Passkeys">
            {passkeys.map((passkey) => (
              <li key={passkey.id} className={styles.item}>
                <span className={styles.itemIcon} aria-hidden="true">
                  <Icon name="key" size={20} />
                </span>
                <div className={styles.itemMeta}>
                  <p className={styles.itemName}>{passkey.name}</p>
                  <p className={styles.itemDetails}>
                    {passkey.synced ? "Synced passkey" : "Device-bound passkey"} · Added{" "}
                    <time dateTime={passkey.createdAt}>
                      {dateFormatter.format(new Date(passkey.createdAt))}
                    </time>{" "}
                    ·{" "}
                    {passkey.lastUsedAt ? (
                      <>
                        Last used{" "}
                        <time dateTime={passkey.lastUsedAt}>
                          {dateFormatter.format(new Date(passkey.lastUsedAt))}
                        </time>
                      </>
                    ) : (
                      "Never used"
                    )}
                  </p>
                </div>
                <div className={styles.itemActions}>
                  <Button
                    variant="danger"
                    icon="trash"
                    onClick={() => setPendingRemoval(passkey)}
                    aria-label={`Remove ${passkey.name}`}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConfirmModal
        open={pendingRemoval !== null}
        title="Remove passkey?"
        message={
          <>
            You won’t be able to sign in with “{pendingRemoval?.name}” anymore. Your password and
            other passkeys keep working. You may also want to delete it from your device’s password
            manager.
          </>
        }
        confirmLabel="Remove passkey"
        danger
        busy={removing}
        onConfirm={() => void confirmRemove()}
        onCancel={() => setPendingRemoval(null)}
      />
    </div>
  );
}
