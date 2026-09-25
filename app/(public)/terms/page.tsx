import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/config/site";
import { LegalPage } from "@/features/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `Terms and Conditions for ${siteConfig.name}'s portfolio website.`,
  alternates: { canonical: siteUrl("/terms") },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions">
      <p>
        The content on this website is provided for informational purposes only. All project
        descriptions, code samples, and other materials are the intellectual property of{" "}
        {siteConfig.name} unless otherwise noted.
      </p>
      <p>
        You may not reproduce, distribute, or use any content from this site without explicit
        written permission, except for personal, non-commercial purposes with proper attribution.
      </p>
      <p>
        This site is provided &ldquo;as is&rdquo; without warranties of any kind. {siteConfig.name} is not
        liable for any damages arising from the use of this website.
      </p>
    </LegalPage>
  );
}
