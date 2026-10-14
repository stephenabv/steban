import type { Metadata } from "next";
import { getSession } from "@/server/auth/session";
import { getPasskeyService } from "@/server/auth/passkeys";
import { toPasskeySummary } from "@/lib/passkeys/PasskeySummary";
import { getAdminBasePath } from "@/lib/adminRoute";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { PasskeyManager } from "@/features/admin/passkeys/PasskeyManager";
import { Alert } from "@/components/ui/Alert";
import styles from "@/features/admin/AdminPage.module.less";

export const metadata: Metadata = { title: "Passkeys" };
export const dynamic = "force-dynamic";

async function loadPasskeys() {
  const session = await getSession();
  try {
    const passkeys = await getPasskeyService().list(session.adminId || "admin");
    return passkeys.map(toPasskeySummary);
  } catch (e) {
    console.error("[passkeys] list failed:", (e as Error).message);
    return null;
  }
}

export default async function AdminPasskeysPage() {
  const passkeys = await loadPasskeys();

  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <AdminPageHeader
        title="Passkeys"
        description="Sign in with Face ID, Touch ID, Windows Hello or a security key instead of your password. Passkeys can't be phished or reused on other sites."
      />
      {passkeys ? (
        <PasskeyManager passkeys={passkeys} basePath={getAdminBasePath()} />
      ) : (
        <Alert tone="danger" title="Couldn't load your passkeys">
          Please refresh the page. If this keeps happening, check the database connection.
        </Alert>
      )}
    </div>
  );
}
