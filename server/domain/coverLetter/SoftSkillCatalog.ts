import { TermCatalog } from "./TermCatalog";
import type { CatalogTerm } from "./TermCatalog";

type Entry = [name: string, aliases: string[]];

const ENTRIES: readonly Entry[] = [
  [
    "clear communication",
    [
      "communication",
      "communication skills",
      "communicate",
      "communicator",
      "written communication",
    ],
  ],
  [
    "collaboration",
    ["collaborative", "teamwork", "team player", "cross-functional", "work closely with"],
  ],
  ["problem solving", ["problem-solving", "problem solver", "troubleshooting", "debugging"]],
  ["ownership", ["take ownership", "accountability", "accountable", "end-to-end"]],
  ["attention to detail", ["detail-oriented", "detail oriented", "meticulous"]],
  ["time management", ["prioritization", "prioritize", "meet deadlines", "deadline-driven"]],
  ["adaptability", ["adaptable", "fast-paced", "learn quickly", "quick learner"]],
  ["leadership", ["lead a team", "leading teams", "tech lead", "team lead"]],
  ["mentoring", ["mentor", "mentorship", "coaching", "code reviews", "code review"]],
  [
    "working independently",
    ["self-motivated", "self-starter", "independently", "autonomous", "autonomy"],
  ],
  ["stakeholder management", ["stakeholder", "stakeholders", "client-facing", "work with clients"]],
];

const TERMS: readonly CatalogTerm<"softSkill">[] = ENTRIES.map(([name, aliases]) => ({
  name,
  aliases,
  kind: "softSkill",
}));

/** Working-style qualities a job description asks for, normalized to one phrase each. */
export class SoftSkillCatalog extends TermCatalog<"softSkill"> {
  constructor(terms: readonly CatalogTerm<"softSkill">[] = TERMS) {
    super(terms);
  }
}
