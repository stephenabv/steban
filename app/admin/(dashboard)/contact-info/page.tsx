import type { Metadata } from "next";
import { getContactService } from "@/server/services";
import { siteConfig } from "@/config/site";
import { ContactEmailEditor } from "@/features/admin/content/ContactEmailEditor";
import { LoadError } from "@/features/admin/content/LoadError";

export const metadata: Metadata = { title: "Contact Info" };
export const dynamic = "force-dynamic";

export default async function AdminContactInfoPage() {
  const result = await getContactService().getContactInfo();
  if (!result.ok) return <LoadError title="Contact information" />;
  const info = result.value;

  return (
    <ContactEmailEditor
      savedAt={info?.updatedAt.toISOString() ?? null}
      initial={{ email: info ? info.email : siteConfig.author.email }}
    />
  );
}
