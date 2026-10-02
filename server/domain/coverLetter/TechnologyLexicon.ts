import { TermCatalog } from "./TermCatalog";
import type { CatalogTerm } from "./TermCatalog";

export type TechnologyKind =
  "language" | "framework" | "library" | "database" | "cloud" | "tool" | "practice";

type Entry = [name: string, kind: TechnologyKind, aliases?: string[], caseSensitive?: boolean];

const ENTRIES: readonly Entry[] = [
  // Languages
  ["JavaScript", "language", ["JS", "ECMAScript", "ES6", "Javascript"]],
  ["TypeScript", "language", ["TS", "Typescript"]],
  ["Python", "language"],
  ["Java", "language"],
  ["Kotlin", "language"],
  ["C#", "language", ["C Sharp", "CSharp"]],
  ["C++", "language", ["CPP"]],
  ["Go", "language", ["Golang"], true],
  ["Rust", "language"],
  ["Ruby", "language"],
  ["PHP", "language"],
  ["Swift", "language", [], true],
  ["Dart", "language"],
  ["SQL", "language"],
  ["HTML", "language", ["HTML5"]],
  ["CSS", "language", ["CSS3"]],
  ["Sass", "language", ["SCSS"]],
  ["LESS", "language", [], true],
  ["Bash", "language", ["Shell scripting"]],
  // Frameworks and runtimes
  ["React", "framework", ["React.js", "ReactJS"]],
  ["React Native", "framework"],
  ["Next.js", "framework", ["NextJS", "Next js"]],
  ["Vue.js", "framework", ["Vue", "VueJS"]],
  ["Nuxt", "framework", ["Nuxt.js"]],
  ["Angular", "framework", ["AngularJS"]],
  ["Svelte", "framework", ["SvelteKit"]],
  ["Node.js", "framework", ["Node", "NodeJS", "Node js"], true],
  ["Express", "framework", ["Express.js", "ExpressJS"], true],
  ["NestJS", "framework", ["Nest.js"]],
  ["Django", "framework"],
  ["Flask", "framework"],
  ["FastAPI", "framework"],
  ["Spring Boot", "framework", ["Spring"], true],
  ["Laravel", "framework"],
  ["Ruby on Rails", "framework", ["Rails"], true],
  [".NET", "framework", ["dotnet", ".NET Core"]],
  ["ASP.NET", "framework", ["ASP.NET Core"]],
  ["Flutter", "framework"],
  ["Electron", "framework"],
  // Libraries
  ["Redux", "library", ["Redux Toolkit"]],
  ["Tailwind CSS", "library", ["Tailwind", "TailwindCSS"]],
  ["Bootstrap", "library"],
  ["jQuery", "library"],
  ["Framer Motion", "library"],
  ["GraphQL", "library"],
  ["Apollo", "library", ["Apollo GraphQL"]],
  ["Prisma", "library"],
  ["Zod", "library"],
  ["Jest", "library"],
  ["Vitest", "library"],
  ["Playwright", "library"],
  ["Cypress", "library"],
  ["Storybook", "library"],
  ["Three.js", "library", ["ThreeJS"]],
  ["Socket.IO", "library", ["Socket.io", "WebSockets", "WebSocket"]],
  // Databases
  ["PostgreSQL", "database", ["Postgres", "Postgre"]],
  ["MySQL", "database"],
  ["MariaDB", "database"],
  ["SQLite", "database"],
  ["MongoDB", "database", ["Mongo"]],
  ["Redis", "database"],
  ["Firebase", "database", ["Firestore"]],
  ["Supabase", "database"],
  ["DynamoDB", "database"],
  ["Elasticsearch", "database", ["Elastic Search"]],
  ["Microsoft SQL Server", "database", ["SQL Server", "MSSQL"]],
  // Cloud and hosting
  ["AWS", "cloud", ["Amazon Web Services"]],
  ["Azure", "cloud", ["Microsoft Azure"]],
  ["Google Cloud", "cloud", ["GCP", "Google Cloud Platform"]],
  ["Vercel", "cloud"],
  ["Netlify", "cloud"],
  ["Heroku", "cloud"],
  ["Cloudflare", "cloud"],
  ["DigitalOcean", "cloud", ["Digital Ocean"]],
  // Tools
  ["Git", "tool", ["Git/GitHub", "GitHub", "Git / GitHub", "GitLab", "Bitbucket"]],
  ["GitHub Actions", "tool"],
  ["Docker", "tool"],
  ["Kubernetes", "tool", ["K8s"]],
  ["Terraform", "tool"],
  ["Jenkins", "tool"],
  ["Webpack", "tool"],
  ["Vite", "tool"],
  ["Turbopack", "tool"],
  ["Figma", "tool"],
  ["Jira", "tool"],
  ["Postman", "tool"],
  ["Linux", "tool", ["Ubuntu"]],
  ["Nginx", "tool"],
  ["WordPress", "tool"],
  ["Shopify", "tool"],
  // Practices
  ["REST APIs", "practice", ["REST", "RESTful", "RESTful APIs", "REST API"], true],
  ["CI/CD", "practice", ["CI / CD", "continuous integration", "continuous delivery"]],
  ["Microservices", "practice", ["microservice architecture"]],
  ["Unit testing", "practice", ["unit tests", "TDD", "test-driven development"]],
  ["Agile", "practice", ["Scrum", "Kanban"]],
  ["Responsive design", "practice", ["responsive web design", "mobile-first"]],
  ["Accessibility", "practice", ["WCAG", "a11y"]],
  ["SEO", "practice", ["search engine optimization"]],
  ["OAuth", "practice", ["OAuth2", "OAuth 2.0", "OpenID Connect", "OIDC"]],
  ["Serverless", "practice", ["AWS Lambda", "Lambda"]],
  ["Machine learning", "practice", ["ML"], true],
];

const TERMS: readonly CatalogTerm<TechnologyKind>[] = ENTRIES.map(
  ([name, kind, aliases = [], caseSensitive = false]) => ({ name, kind, aliases, caseSensitive })
);

/**
 * Known technologies with synonym normalization ("JS" → "JavaScript",
 * "Git/GitHub" → "Git"). Shared by extraction, matching and the honesty guard
 * so all three agree on what a technology is called.
 */
export class TechnologyLexicon extends TermCatalog<TechnologyKind> {
  constructor(terms: readonly CatalogTerm<TechnologyKind>[] = TERMS) {
    super(terms);
  }

  /** Tools and platforms are reported separately from skills in requirements. */
  static isTool(kind: TechnologyKind): boolean {
    return kind === "tool" || kind === "cloud";
  }
}
