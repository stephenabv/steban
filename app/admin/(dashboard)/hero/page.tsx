import type { Metadata } from "next";
import { getHeroService } from "@/server/services";
import { siteConfig } from "@/config/site";
import { HeroEditor } from "@/features/admin/content/HeroEditor";
import { LoadError } from "@/features/admin/content/LoadError";

export const metadata: Metadata = { title: "Hero" };
export const dynamic = "force-dynamic";

export default async function AdminHeroPage() {
  const result = await getHeroService().getHero();
  if (!result.ok) return <LoadError title="Hero section" />;
  const hero = result.value;

  return (
    <HeroEditor
      savedAt={hero?.updatedAt.toISOString() ?? null}
      initial={{
        // Unsaved: start from what the site shows today.
        name: hero?.name ?? siteConfig.name,
        title: hero?.title ?? "Computer Engineer",
        introduction: hero?.introduction ?? "",
        photoUrl: hero?.photoUrl ?? "",
        photoAlt: hero?.photoAlt ?? "",
      }}
    />
  );
}
