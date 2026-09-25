import { getPublicContact } from "@/lib/content/publicContent";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import styles from "./CtaBand.module.less";

export interface CtaBandProps {
  title?: string;
  description?: string;
}

/** Closing call-to-action that routes visitors to the contact form. */
export async function CtaBand({
  title = "Have a project in mind?",
  description = "Whether it's a new product, a hard technical problem, or a role on your team — let's talk about how I can help.",
}: CtaBandProps) {
  const { email } = await getPublicContact();
  return (
    <section className={styles.wrap} aria-labelledby="cta-heading">
      <Reveal className={styles.band}>
        <div className={styles.glow} aria-hidden="true" />
        <div className={styles.text}>
          <h2 id="cta-heading" className={styles.title}>
            {title}
          </h2>
          <p className={styles.description}>{description}</p>
        </div>
        <div className={styles.actions}>
          <Button href="/contact" size="lg" iconRight="arrow-right">
            Start a conversation
          </Button>
          {email && (
            <Button href={`mailto:${email}`} size="lg" variant="secondary" icon="mail">
              Email me
            </Button>
          )}
        </div>
      </Reveal>
    </section>
  );
}
