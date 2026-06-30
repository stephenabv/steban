import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `Terms and Conditions for ${siteConfig.name}'s portfolio website.`,
};

export default function TermsPage() {
  return (
    <div style={{ padding: "8rem 2rem 6rem", maxWidth: "760px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "2rem" }}>Terms &amp; Conditions</h1>
      <p style={{ color: "#9090a8", lineHeight: 1.75, marginBottom: "1.5rem" }}>
        The content on this website is provided for informational purposes only. All project
        descriptions, code samples, and other materials are the intellectual property of&nbsp;
        {siteConfig.name} unless otherwise noted.
      </p>
      <p style={{ color: "#9090a8", lineHeight: 1.75, marginBottom: "1.5rem" }}>
        You may not reproduce, distribute, or use any content from this site without explicit
        written permission, except for personal, non-commercial purposes with proper attribution.
      </p>
      <p style={{ color: "#9090a8", lineHeight: 1.75, marginBottom: "1.5rem" }}>
        This site is provided &ldquo;as is&rdquo; without warranties of any kind. {siteConfig.name} is not
        liable for any damages arising from the use of this website.
      </p>
      <p style={{ color: "#606075", fontSize: "0.875rem" }}>
        Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })}.
      </p>
    </div>
  );
}
