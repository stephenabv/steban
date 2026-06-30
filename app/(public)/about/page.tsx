import type { Metadata } from "next";
import { AboutContent } from "@/features/about/AboutContent";
import { siteConfig } from "@/config/site";
import styles from "./about.module.less";

export const metadata: Metadata = {
  title: "About",
  description: `Learn more about ${siteConfig.name} — skills, experience, education, and background.`,
  alternates: { canonical: `${siteConfig.url}/about` },
};

// TODO: fetch from AboutService when DB is wired up
const about = null;

export default function AboutPage() {
  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.heading}>About Me</h1>
        <p className={styles.subheading}>
          Senior Software Engineer with a passion for building scalable, secure, and beautiful
          digital experiences.
        </p>
      </div>
      <div className={styles.content}>
        <AboutContent about={about} />
      </div>
    </div>
  );
}
