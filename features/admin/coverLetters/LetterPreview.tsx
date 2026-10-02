import type { CoverLetterSections, Paragraph } from "@/server/domain/coverLetter";
import styles from "./CoverLetters.module.less";

/** Text runs render as React text nodes, so letter content is always escaped. */
function Runs({ paragraph }: { paragraph: Paragraph }) {
  return (
    <p>
      {paragraph.map((run, index) =>
        run.bold ? <strong key={index}>{run.text}</strong> : <span key={index}>{run.text}</span>
      )}
    </p>
  );
}

function Lines({ lines, className }: { lines: readonly string[]; className?: string }) {
  return (
    <div className={`${styles.letterBlock} ${className ?? ""}`}>
      {lines.map((line, index) => (
        <span key={index}>{line}</span>
      ))}
    </div>
  );
}

/** The letter as it will read once exported. */
export function LetterPreview({ sections }: { sections: CoverLetterSections }) {
  return (
    <article className={styles.letter} aria-label="Cover letter preview">
      <header className={styles.letterHeader}>
        <span className={styles.letterName}>{sections.header.fullName}</span>
        <Lines lines={sections.header.lines} className={styles.letterLines} />
      </header>
      <p>{sections.date}</p>
      <Lines lines={sections.recipient} />
      <p>{sections.salutation}</p>
      {sections.body.map((paragraph, index) => (
        <Runs key={index} paragraph={paragraph} />
      ))}
      {sections.closing.slice(0, -1).map((line, index) => (
        <p key={index}>{line}</p>
      ))}
      <Lines lines={[...sections.closing.slice(-1), sections.signature]} />
    </article>
  );
}
