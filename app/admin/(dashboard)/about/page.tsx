import type { Metadata } from "next";
import { getAboutService } from "@/server/services";
import { AboutEditor } from "@/features/admin/content/AboutEditor";
import { LoadError } from "@/features/admin/content/LoadError";

export const metadata: Metadata = { title: "About" };
export const dynamic = "force-dynamic";

/** Date → "YYYY-MM" for <input type="month">. */
const month = (d?: Date) => (d ? d.toISOString().slice(0, 7) : "");

export default async function AdminAboutPage() {
  const result = await getAboutService().getAbout();
  if (!result.ok) return <LoadError title="About" />;
  const about = result.value;

  return (
    <AboutEditor
      savedAt={about?.updatedAt.toISOString() ?? null}
      initial={{
        biography: about?.biography ?? "",
        skills: (about?.skills ?? [])
          .toSorted((a, b) => a.order - b.order)
          .map(({ id, name, category, proficiencyLevel }) => ({ id, name, category, proficiencyLevel })),
        experience: (about?.experience ?? []).map((e) => ({
          id: e.id,
          company: e.company,
          role: e.role,
          startDate: month(e.startDate),
          endDate: month(e.endDate),
          current: e.current,
          description: e.description,
          technologies: e.technologies.join(", "),
        })),
        education: (about?.education ?? []).map((e) => ({
          id: e.id,
          institution: e.institution,
          degree: e.degree,
          field: e.field,
          startYear: String(e.startYear),
          endYear: e.endYear ? String(e.endYear) : "",
          description: e.description ?? "",
        })),
        certifications: (about?.certifications ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          issuer: c.issuer,
          issuedAt: month(c.issuedAt),
          expiresAt: month(c.expiresAt),
          credentialUrl: c.credentialUrl ?? "",
        })),
        awards: (about?.awards ?? []).map((a) => ({
          id: a.id,
          title: a.title,
          issuer: a.issuer,
          year: String(a.year),
          description: a.description ?? "",
        })),
      }}
    />
  );
}
