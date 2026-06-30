import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${siteConfig.name}'s portfolio website.`,
};

export default function PrivacyPage() {
  return (
    <div style={{ padding: "8rem 2rem 6rem", maxWidth: "760px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "2rem" }}>Privacy Policy</h1>
      <p style={{ color: "#9090a8", lineHeight: 1.75, marginBottom: "1.5rem" }}>
        This website does not collect personal data beyond what is voluntarily submitted via the
        contact form. Contact form data (name, email, subject, message) is used solely to respond
        to your inquiry and is not shared with third parties.
      </p>
      <p style={{ color: "#9090a8", lineHeight: 1.75, marginBottom: "1.5rem" }}>
        This site uses Google Analytics 4 to understand aggregate usage patterns. GA4 data is
        anonymous and subject to&nbsp;
        <a href="https://policies.google.com/privacy" style={{ color: "#818cf8" }} target="_blank" rel="noopener noreferrer">
          Google&apos;s Privacy Policy
        </a>.
      </p>
      <p style={{ color: "#606075", fontSize: "0.875rem" }}>
        Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })}.
      </p>
    </div>
  );
}
