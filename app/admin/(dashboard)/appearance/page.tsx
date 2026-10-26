import type { Metadata } from "next";
import { getAppearanceService } from "@/server/services";
import { DEFAULT_GRADIENT_STOPS } from "@/lib/theme/gradient";
import { AppearanceEditor } from "@/features/admin/content/AppearanceEditor";
import { LoadError } from "@/features/admin/content/LoadError";

export const metadata: Metadata = { title: "Appearance" };
export const dynamic = "force-dynamic";

export default async function AdminAppearancePage() {
  const result = await getAppearanceService().get();
  if (!result.ok) return <LoadError title="Appearance" />;
  const appearance = result.value;

  return (
    <AppearanceEditor
      savedAt={appearance?.updatedAt.toISOString() ?? null}
      initial={{ gradientStops: [...(appearance?.gradientStops ?? DEFAULT_GRADIENT_STOPS)] }}
    />
  );
}
