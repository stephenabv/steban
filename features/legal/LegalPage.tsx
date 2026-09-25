import { PageShell } from "@/features/shared/PageShell";
import { RichText } from "@/components/content/RichText";
import { Markup } from "@/lib/markup/Markup";
import type { PublicLegalDocument } from "@/lib/content/publicContent";
import styles from "./LegalPage.module.less";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" });

/** Shows an on-page contents list once a document is long enough to need one. */
const MIN_HEADINGS_FOR_CONTENTS = 4;

export function LegalPage({ document }: { document: PublicLegalDocument }) {
  const blocks = Markup.parse(document.body);
  const headings = Markup.headings(blocks).filter((h) => h.level === 2);

  return (
    <PageShell eyebrow="Legal" title={document.title} width="prose">
      <article className={styles.prose}>
        {headings.length >= MIN_HEADINGS_FOR_CONTENTS && (
          <nav className={styles.contents} aria-label="On this page">
            <p className={styles.contentsTitle}>On this page</p>
            <ol role="list">
              {headings.map((h) => (
                <li key={h.id}>
                  <a href={`#${h.id}`}>{h.text}</a>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <RichText blocks={blocks} />
        <p className={styles.updated}>
          Effective{" "}
          <time dateTime={document.effectiveDate.toISOString()}>{dateFormatter.format(document.effectiveDate)}</time>
          {document.versionNumber !== null && <> · Version {document.versionNumber}</>}
        </p>
      </article>
    </PageShell>
  );
}
