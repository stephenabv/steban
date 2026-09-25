import type { Metadata } from "next";
import { getFooterService } from "@/server/services";
import { FooterEditor } from "@/features/admin/content/FooterEditor";
import { LoadError } from "@/features/admin/content/LoadError";

export const metadata: Metadata = { title: "Footer" };
export const dynamic = "force-dynamic";

export default async function AdminFooterPage() {
  const result = await getFooterService().get();
  if (!result.ok) return <LoadError title="Footer" />;
  const footer = result.value;

  return (
    <FooterEditor
      savedAt={footer?.updatedAt.toISOString() ?? null}
      initial={{ privacyUrl: footer?.privacyUrl ?? "/privacy", termsUrl: footer?.termsUrl ?? "/terms" }}
    />
  );
}
