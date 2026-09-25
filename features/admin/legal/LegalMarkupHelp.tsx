import { Fragment } from "react";

const SYNTAX: ReadonlyArray<[string, string]> = [
  ["## Section title", "Section heading (listed in “On this page”)"],
  ["### Subsection", "Smaller heading"],
  ["**important**", "Bold text"],
  ["- item", "Bulleted list (one item per line)"],
  ["1. item", "Numbered list"],
  ["[label](https://…)", "Link — https://, mailto: or a site path like /contact"],
  ["(blank line)", "Starts a new paragraph"],
];

export function LegalMarkupHelp({ className }: { className?: string }) {
  return (
    <details className={className}>
      <summary>Formatting help</summary>
      <dl>
        {SYNTAX.map(([syntax, meaning]) => (
          <Fragment key={syntax}>
            <dt>
              <code>{syntax}</code>
            </dt>
            <dd>{meaning}</dd>
          </Fragment>
        ))}
      </dl>
    </details>
  );
}
