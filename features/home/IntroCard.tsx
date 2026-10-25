import type { PublicContact } from "@/lib/content/publicContent";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/icons/Icon";
import styles from "./IntroCard.module.less";

interface Props {
  title: string;
  contact: PublicContact;
}

/** Facebook-style "Intro" card beside the home feed: role, ways to reach out, and a link to About. */
export function IntroCard({ title, contact }: Props) {
  return (
    <aside className={styles.card} aria-labelledby="intro-heading">
      <h2 id="intro-heading" className={styles.heading}>
        Intro
      </h2>

      <ul className={styles.facts} role="list">
        <li>
          <Icon name="briefcase" size={20} />
          <span>{title}</span>
        </li>
        {contact.email && (
          <li>
            <Icon name="mail" size={20} />
            <a href={`mailto:${contact.email}`} className={styles.link}>
              {contact.email}
            </a>
          </li>
        )}
        {contact.profiles.map((profile) => (
          <li key={profile.platform}>
            <Icon name={profile.icon} size={20} />
            <a href={profile.url} className={styles.link} target="_blank" rel="noopener noreferrer">
              {profile.label}
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>

      <Button href="/about" variant="secondary" fullWidth>
        More about me
      </Button>
    </aside>
  );
}
