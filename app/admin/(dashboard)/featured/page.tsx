import type { Metadata } from "next";
import { getProjectService } from "@/server/services";
import { getAdminBasePath } from "@/lib/adminRoute";
import { AdminPageHeader } from "@/features/admin/AdminPageHeader";
import { FeaturedManager } from "@/features/admin/FeaturedManager";
import { MAX_FEATURED } from "@/features/admin/constants";
import { toAdminProjectRow } from "@/features/admin/projects/toAdminProjectRow";
import { Alert } from "@/components/ui/Alert";
import styles from "@/features/admin/AdminPage.module.less";

export const metadata: Metadata = { title: "Featured Projects" };

export const dynamic = "force-dynamic";

export default async function AdminFeaturedPage() {
  const service = getProjectService();
  const [allResult, featuredResult] = await Promise.all([service.getAll({ pageSize: 100 }), service.getFeatured()]);

  const featured = featuredResult.ok ? featuredResult.value.map(toAdminProjectRow) : [];
  const featuredIds = new Set(featured.map((p) => p.id));
  const others = allResult.ok ? allResult.value.items.filter((p) => !featuredIds.has(p.id)).map(toAdminProjectRow) : [];

  return (
    <div className={`${styles.page} ${styles.narrow}`}>
      <AdminPageHeader
        title="Featured projects"
        description={`Choose up to ${MAX_FEATURED} projects for the home page carousel.`}
      />
      {allResult.ok && featuredResult.ok ? (
        <FeaturedManager featured={featured} others={others} newHref={`${getAdminBasePath()}/projects/new`} />
      ) : (
        <Alert tone="danger" title="Failed to load projects">
          Please refresh the page.
        </Alert>
      )}
    </div>
  );
}
