import type { Metadata } from "next";
import { ContactForm } from "@/features/contact/ContactForm";
import { ContactChannels } from "@/features/contact/ContactChannels";
import { PageShell } from "@/features/shared/PageShell";
import { getPageMetadata, getPublicContact } from "@/lib/content/publicContent";
import { pageSeoDefaults } from "@/config/seo";
import { siteUrl } from "@/config/site";
import styles from "./contact.module.less";

export function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("contact", {
    title: pageSeoDefaults.contact.title,
    description: pageSeoDefaults.contact.description,
    alternates: { canonical: siteUrl("/contact") },
  });
}

export default async function ContactPage() {
  const contact = await getPublicContact();
  return (
    <PageShell
      eyebrow="Contact"
      title="Get in touch"
      description="Have a project in mind or just want to say hello? I'd love to hear from you."
    >
      <div className={styles.grid}>
        <div className={styles.info}>
          <h2 className={styles.infoTitle}>Let&apos;s work together</h2>
          <p className={styles.infoText}>
            Whether you&apos;re looking for a senior engineer to join your team, want to collaborate on an
            open-source project, or just want to connect — feel free to reach out.
          </p>
          <ContactChannels email={contact.email} channels={contact.profiles} />
        </div>

        <ContactForm />
      </div>
    </PageShell>
  );
}
