import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/config/site";
import { LEGAL_DOCUMENTS } from "@/config/legal";
import { getLegalDocument } from "@/lib/content/publicContent";
import { LegalPage } from "@/features/legal/LegalPage";

const DEFINITION = LEGAL_DOCUMENTS.terms;

export async function generateMetadata(): Promise<Metadata> {
  const document = await getLegalDocument(DEFINITION.kind);
  return {
    title: document.title,
    description: `${document.title} for ${siteConfig.name}'s portfolio website.`,
    alternates: { canonical: siteUrl(DEFINITION.path) },
  };
}

export default async function TermsPage() {
  return <LegalPage document={await getLegalDocument(DEFINITION.kind)} />;
}
