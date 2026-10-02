import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import type { RequirementGapView, RequirementMatchView } from "./CoverLetterDto";
import { REQUIREMENT_KIND_LABELS } from "./coverLetterOptions";
import styles from "./CoverLetters.module.less";
import pageStyles from "../AdminPage.module.less";

export function MatchedRequirements({ matches }: { matches: readonly RequirementMatchView[] }) {
  return (
    <Card as="section" aria-labelledby="matched-requirements">
      <CardHeader
        as="h3"
        id="matched-requirements"
        title="Matched requirements"
        description="What the posting asks for, and where your profile backs it up."
      />
      {matches.length === 0 ? (
        <p className={pageStyles.muted}>No requirements matched your profile.</p>
      ) : (
        <ul className={styles.requirementList}>
          {matches.map((match) => (
            <li key={`${match.kind}:${match.term}`} className={styles.requirement}>
              <span className={styles.requirementTop}>
                <span>{match.term}</span>
                <Badge tone="success" title="Confidence">
                  {match.confidence}%
                </Badge>
              </span>
              <span className={pageStyles.muted}>{REQUIREMENT_KIND_LABELS[match.kind]}</span>
              <ul className={styles.evidence}>
                {match.evidence.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function RequirementGaps({ gaps }: { gaps: readonly RequirementGapView[] }) {
  return (
    <Card as="section" aria-labelledby="requirement-gaps">
      <CardHeader
        as="h3"
        id="requirement-gaps"
        title="Gaps not mentioned"
        description="The posting asks for these but your profile doesn't show them, so the letter leaves them out."
      />
      {gaps.length === 0 ? (
        <p className={pageStyles.muted}>
          None. Every detected requirement is backed by your profile.
        </p>
      ) : (
        <ul className={styles.gapList}>
          {gaps.map((gap) => (
            <li key={`${gap.kind}:${gap.term}`}>
              <Badge tone="neutral" title={REQUIREMENT_KIND_LABELS[gap.kind]}>
                {gap.term}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
