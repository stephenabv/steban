import type { About } from "@/server/domain/entities";
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

function formatDateRange(start: Date, end?: Date, current?: boolean) {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return current ? `${fmt(start)} — Present` : end ? `${fmt(start)} — ${fmt(end)}` : fmt(start);
}

export function AboutContent({ about }: Props) {
  const skillsByCategory = about ? groupBy(about.skills, "category") : {};

  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Biography</h2>
        {about?.biography ? (
          <p className={styles.bio}>{about.biography}</p>
        ) : (
          <p className={styles.empty}>Biography coming soon.</p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="skills-heading">
        <h2 id="skills-heading" className={styles.sectionTitle}>Skills</h2>
        {Object.keys(skillsByCategory).length > 0 ? (
          <div className={styles.skillCategories}>
            {Object.entries(skillsByCategory).map(([cat, skills]) => (
              <div key={cat} className={styles.skillCategory}>
                <h3>{cat}</h3>
                <ul className={styles.skillList} role="list">
                  {skills.map((s) => (
                    <li key={s.id} className={styles.skillBadge}>{s.name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>Skills coming soon.</p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="experience-heading">
        <h2 id="experience-heading" className={styles.sectionTitle}>Experience</h2>
        {about && about.experience.length > 0 ? (
          <ol className={styles.timeline} reversed>
            {about.experience.map((exp) => (
              <li key={exp.id} className={styles.timelineItem}>
                <p className={styles.timelineDate}>
                  {formatDateRange(exp.startDate, exp.endDate, exp.current)}
                </p>
                <h3 className={styles.timelineTitle}>{exp.role}</h3>
                <p className={styles.timelineSubtitle}>{exp.company}</p>
                <p className={styles.timelineDescription}>{exp.description}</p>
                {exp.technologies.length > 0 && (
                  <ul className={styles.timelineTechs} aria-label="Technologies used">
                    {exp.technologies.map((t) => (
                      <li key={t} className={styles.timelineTech}>{t}</li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.empty}>Experience coming soon.</p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="education-heading">
        <h2 id="education-heading" className={styles.sectionTitle}>Education</h2>
        {about && about.education.length > 0 ? (
          <ol className={styles.timeline}>
            {about.education.map((edu) => (
              <li key={edu.id} className={styles.timelineItem}>
                <p className={styles.timelineDate}>
                  {edu.endYear ?? edu.startYear}
                </p>
                <h3 className={styles.timelineTitle}>{edu.degree} in {edu.field}</h3>
                <p className={styles.timelineSubtitle}>{edu.institution}</p>
                {edu.description && (
                  <p className={styles.timelineDescription}>{edu.description}</p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.empty}>Education coming soon.</p>
        )}
      </section>

      {about && about.certifications.length > 0 && (
        <section className={styles.section} aria-labelledby="certs-heading">
          <h2 id="certs-heading" className={styles.sectionTitle}>Certifications</h2>
          <ul className={styles.certsGrid} role="list">
            {about.certifications.map((cert) => (
              <li key={cert.id} className={styles.certCard}>
                <h3 className={styles.certName}>{cert.name}</h3>
                <p className={styles.certIssuer}>{cert.issuer}</p>
                <p className={styles.certDate}>
                  {new Date(cert.issuedAt).getFullYear()}
                  {cert.expiresAt ? ` – ${new Date(cert.expiresAt).getFullYear()}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {about && about.awards.length > 0 && (
        <section className={styles.section} aria-labelledby="awards-heading">
          <h2 id="awards-heading" className={styles.sectionTitle}>Awards</h2>
          <ul className={styles.certsGrid} role="list">
            {about.awards.map((award) => (
              <li key={award.id} className={styles.certCard}>
                <h3 className={styles.certName}>{award.title}</h3>
                <p className={styles.certIssuer}>{award.issuer}</p>
                <p className={styles.certDate}>{award.year}</p>
                {award.description && (
                  <p className={styles.timelineDescription}>{award.description}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
