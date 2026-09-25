import type { Metadata } from "next";
import { siteConfig, siteUrl } from "@/config/site";
import { LegalPage } from "@/features/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${siteConfig.name}'s portfolio website.`,
  alternates: { canonical: siteUrl("/privacy") },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This website does not collect personal data beyond what is voluntarily submitted via the
        contact form. Contact form data (name, email, subject, message) is used solely to respond
        to your inquiry and is not shared with third parties.
      </p>
      <p>
        This site uses Google Analytics 4 to understand aggregate usage patterns. GA4 data is
        anonymous and subject to{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
          Google&apos;s Privacy Policy
        </a>
        .
      </p>
    </LegalPage>
  );
}
