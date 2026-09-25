import type { Metadata } from "next";
import { getContactService } from "@/server/services";
import { socialLinks } from "@/config/social";
import { SocialLinksEditor } from "@/features/admin/content/SocialLinksEditor";
import { LoadError } from "@/features/admin/content/LoadError";

export const metadata: Metadata = { title: "Social Links" };
export const dynamic = "force-dynamic";

export default async function AdminSocialPage() {
  const result = await getContactService().getContactInfo();
  if (!result.ok) return <LoadError title="Social links" />;
  const info = result.value;

  return (
    <SocialLinksEditor
      savedAt={info?.updatedAt.toISOString() ?? null}
      initial={
        info
          ? { githubUrl: info.githubUrl, linkedinUrl: info.linkedinUrl, facebookUrl: info.facebookUrl }
          : {
              githubUrl: socialLinks.github.url,
              linkedinUrl: socialLinks.linkedin.url,
              facebookUrl: socialLinks.facebook.url,
            }
      }
    />
  );
}
