import type { ApplicantProfile } from "@/server/domain/coverLetter";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons/Icon";
import styles from "./CoverLetters.module.less";
import pageStyles from "../AdminPage.module.less";

const EDIT_LINKS = [
  { path: "/hero", label: "Name and title" },
  { path: "/about", label: "Skills and experience" },
  { path: "/projects", label: "Projects" },
  { path: "/contact-info", label: "Email" },
  { path: "/social", label: "Profile links" },
] as const;

/** Read-only view of the profile the letter is written from. */
export function ProfileSummary({
  profile,
  basePath,
}: {
  profile: ApplicantProfile;
  basePath: string;
}) {
  const skills = profile.skillGroups.flatMap((group) => group.skills);
  const current = profile.experiences.find((experience) => experience.current);
  const links = [
    profile.contact.email,
    profile.contact.portfolioUrl,
    profile.contact.githubUrl,
    profile.contact.linkedinUrl,
  ].filter((link): link is string => Boolean(link));

  return (
    <details className={styles.profile}>
      <summary>
        <span>
          Your details: {profile.fullName}, {profile.title}
        </span>
        <Icon name="chevron-down" size={16} />
      </summary>
      <div className={styles.profileBody}>
        <p className={pageStyles.muted}>
          These fill in automatically from your portfolio. Change them where they live.
        </p>
        <dl className={pageStyles.definitionList}>
          <dt>Contact</dt>
          <dd>{links.join(" · ") || "Not set"}</dd>
          <dt>Current role</dt>
          <dd>{current ? `${current.role} at ${current.company}` : "Not set"}</dd>
          <dt>Experience</dt>
          <dd>{profile.experiences.length} roles</dd>
          <dt>Projects</dt>
          <dd>{profile.projects.length} projects</dd>
          <dt>Skills</dt>
          <dd>{skills.join(", ") || "Not set"}</dd>
        </dl>
        <div className={styles.profileLinks}>
          {EDIT_LINKS.map((link) => (
            <Button
              key={link.path}
              href={`${basePath}${link.path}`}
              variant="secondary"
              size="sm"
              icon="pencil"
            >
              {link.label}
            </Button>
          ))}
        </div>
      </div>
    </details>
  );
}
