import type { ReactNode } from "react";
import type { About } from "@/server/domain/entities";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { Icon } from "@/components/icons/Icon";
import type { IconName } from "@/components/icons/Icon";
import { SectionNav } from "./SectionNav";
import type { SectionNavItem } from "./SectionNav";
import styles from "./AboutContent.module.less";

interface Props {
  about: About | null;
}

function groupBy<T>(arr: T[], key: keyof T) {
  return arr.reduce<Record<string, T[]>>((acc, item) => {
    const k = String(item[key]);
    (acc[k] ??= []).push(item);
    return acc;
  }, {});
}

const monthYear = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });

function formatDateRange(start: Date, end?: Date, current?: boolean) {
  const fmt = (d: Date) => monthYear.format(new Date(d));
  return current ? `${fmt(start)} — Present` : end ? `${fmt(start)} — ${fmt(end)}` : fmt(start);
}

function AboutSection({ id, title, icon, children }: { id: string; title: string; icon: IconName; children: ReactNode }) {
  return (
    <Reveal as="section" className={styles.section}>
      <h2 id={id} className={styles.sectionTitle}>
        <span className={styles.sectionIcon} aria-hidden="true">
          <Icon name={icon} size={18} />
        </span>
        {title}
      </h2>
      {children}
    </Reveal>
  );
}

function ComingSoon({ what }: { what: string }) {
  return <p className={styles.empty}>{what} coming soon.</p>;
}

export function AboutContent({ about }: Props) {
  // No profile content yet: one clear message beats five empty sections.
  if (!about) {
    return (
      <EmptyState
        icon="user"
        title="Full profile coming soon"
        description="Biography, skills, experience and education are being written up. In the meantime, the projects speak for themselves."
        action={
          <>
            <Button href="/projects" iconRight="arrow-right">
              Browse projects
            </Button>
            <Button href="/contact" variant="secondary">
              Get in touch
            </Button>
          </>
        }
      />
    );
  }

  const skillsByCategory = groupBy(about.skills, "category");

  const sections: SectionNavItem[] = [
    { id: "biography", label: "Biography" },
    { id: "skills", label: "Skills" },
    { id: "experience", label: "Experience" },
    { id: "education", label: "Education" },
    ...(about.certifications.length > 0 ? [{ id: "certifications", label: "Certifications" }] : []),
    ...(about.awards.length > 0 ? [{ id: "awards", label: "Awards" }] : []),
  ];

  return (
    <div className={styles.layout}>
      <aside className={styles.aside}>
        <SectionNav items={sections} />
      </aside>

      <div className={styles.sections}>
        <AboutSection id="biography" title="Biography" icon="user">
          {about.biography ? <p className={styles.bio}>{about.biography}</p> : <ComingSoon what="Biography" />}
        </AboutSection>

        <AboutSection id="skills" title="Skills" icon="code">
          {Object.keys(skillsByCategory).length > 0 ? (
            <ul className={styles.skillCategories} role="list">
              {Object.entries(skillsByCategory).map(([cat, skills]) => (
                <li key={cat} className={styles.skillCategory}>
                  <h3>{cat}</h3>
                  <ul className={styles.skillList} role="list">
                    {skills.map((s) => (
                      <li key={s.id} className={styles.skillBadge}>
                        {s.name}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          ) : (
            <ComingSoon what="Skills" />
          )}
        </AboutSection>

        <AboutSection id="experience" title="Experience" icon="briefcase">
          {about.experience.length > 0 ? (
            <ol className={styles.timeline} role="list">
              {about.experience.map((exp) => (
                <li key={exp.id} className={styles.timelineItem}>
                  <p className={styles.timelineDate}>{formatDateRange(exp.startDate, exp.endDate, exp.current)}</p>
                  <h3 className={styles.timelineTitle}>{exp.role}</h3>
                  <p className={styles.timelineSubtitle}>{exp.company}</p>
                  <p className={styles.timelineDescription}>{exp.description}</p>
                  {exp.technologies.length > 0 && (
                    <ul className={styles.timelineTechs} role="list" aria-label="Technologies used">
                      {exp.technologies.map((t) => (
                        <li key={t} className={styles.timelineTech}>
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <ComingSoon what="Experience" />
          )}
        </AboutSection>

        <AboutSection id="education" title="Education" icon="graduation-cap">
          {about.education.length > 0 ? (
            <ol className={styles.timeline} role="list">
              {about.education.map((edu) => (
                <li key={edu.id} className={styles.timelineItem}>
                  <p className={styles.timelineDate}>{edu.endYear ?? edu.startYear}</p>
                  <h3 className={styles.timelineTitle}>
                    {edu.degree} in {edu.field}
                  </h3>
                  <p className={styles.timelineSubtitle}>{edu.institution}</p>
                  {edu.description && <p className={styles.timelineDescription}>{edu.description}</p>}
                </li>
              ))}
            </ol>
          ) : (
            <ComingSoon what="Education" />
          )}
        </AboutSection>

        {about.certifications.length > 0 && (
          <AboutSection id="certifications" title="Certifications" icon="check-circle">
            <ul className={styles.certsGrid} role="list">
              {about.certifications.map((cert) => (
                <li key={cert.id} className={styles.certCard}>
                  <h3 className={styles.certName}>{cert.name}</h3>
                  <p className={styles.certIssuer}>{cert.issuer}</p>
                  <p className={styles.certDate}>
                    {new Date(cert.issuedAt).getFullYear()}
                    {cert.expiresAt ? ` – ${new Date(cert.expiresAt).getFullYear()}` : ""}
                  </p>
                  {cert.credentialUrl && (
                    <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className={styles.certLink}>
                      View credential <Icon name="external" size={12} />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </AboutSection>
        )}

        {about.awards.length > 0 && (
          <AboutSection id="awards" title="Awards" icon="award">
            <ul className={styles.certsGrid} role="list">
              {about.awards.map((award) => (
                <li key={award.id} className={styles.certCard}>
                  <h3 className={styles.certName}>{award.title}</h3>
                  <p className={styles.certIssuer}>{award.issuer}</p>
                  <p className={styles.certDate}>{award.year}</p>
                  {award.description && <p className={styles.timelineDescription}>{award.description}</p>}
                </li>
              ))}
            </ul>
          </AboutSection>
        )}
      </div>
    </div>
  );
}
