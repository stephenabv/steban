import type { Metadata } from "next";
import { getHeroService, getProfilePhotoService, ProfilePhotoService } from "@/server/services";
import { siteConfig } from "@/config/site";
import { initials } from "@/lib/initials";
import { toManagedFileSummary } from "@/lib/files/ManagedFileSummary";
import { HeroEditor } from "@/features/admin/content/HeroEditor";
import { LoadError } from "@/features/admin/content/LoadError";
import { ProfilePhotoManager } from "@/features/admin/files/ProfilePhotoManager";
import { Alert } from "@/components/ui/Alert";

export const metadata: Metadata = { title: "Hero" };
export const dynamic = "force-dynamic";

export default async function AdminHeroPage() {
  const [result, photoResult] = await Promise.all([getHeroService().getHero(), getProfilePhotoService().getActive()]);
  if (!result.ok) return <LoadError title="Hero section" />;
  const hero = result.value;
  const photo = photoResult.ok ? photoResult.value : null;
  const name = hero?.name ?? siteConfig.name;

  return (
    <HeroEditor
      savedAt={hero?.updatedAt.toISOString() ?? null}
      initial={{
        // Unsaved: start from what the site shows today.
        name,
        title: hero?.title ?? "Computer Engineer",
        introduction: hero?.introduction ?? "",
        photoAlt: hero?.photoAlt ?? "",
      }}
      photoManager={
        photoResult.ok ? (
          <ProfilePhotoManager
            photo={photo && toManagedFileSummary(photo)}
            src={photo && ProfilePhotoService.publicPath(photo)}
            initials={initials(name)}
          />
        ) : (
          <Alert tone="danger" title="Couldn't load the profile photo">
            Please refresh the page. If this keeps happening, check the database connection.
          </Alert>
        )
      }
    />
  );
}

