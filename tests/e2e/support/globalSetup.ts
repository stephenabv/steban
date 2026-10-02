import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const CONTENT_DIR = path.join(DATA_DIR, "content");
/** Letters the tests write go here; removed afterwards only if this run created the file. */
const LETTER_STORE = path.join(DATA_DIR, "cover-letters.json");
/** Files this run created, so teardown removes only those. */
export const SEEDED_MANIFEST = path.join(__dirname, "..", ".auth", "seeded.json");

const SEED: Record<string, unknown> = {
  hero: {
    name: "Stephen Abueva",
    title: "Full-Stack Developer",
    introduction: "I build fast, accessible web applications.",
    photoAlt: "",
  },
  about: {
    biography: "Full-stack developer focused on React, Next.js and Node.js services.",
    skills: [
      { id: "s1", name: "TypeScript", category: "Languages", proficiencyLevel: 5, order: 1 },
      { id: "s2", name: "React", category: "Frontend", proficiencyLevel: 5, order: 2 },
      { id: "s3", name: "Next.js", category: "Frontend", proficiencyLevel: 4, order: 3 },
      { id: "s4", name: "Node.js", category: "Backend", proficiencyLevel: 4, order: 4 },
    ],
    experience: [
      {
        id: "e1",
        company: "Northwind Digital",
        role: "Senior Frontend Developer",
        startDate: "2023-02-01T00:00:00.000Z",
        current: true,
        description: "Led the migration of a customer portal to Next.js and TypeScript.",
        technologies: ["Next.js", "TypeScript", "React"],
      },
    ],
    education: [],
    certifications: [],
    awards: [],
  },
};

async function exists(file: string): Promise<boolean> {
  return fs.access(file).then(
    () => true,
    () => false
  );
}

/** Gives the test server a profile when the local JSON store has none. Never overwrites. */
export default async function globalSetup(): Promise<void> {
  await fs.mkdir(CONTENT_DIR, { recursive: true });
  await fs.mkdir(path.dirname(SEEDED_MANIFEST), { recursive: true });
  const seeded: string[] = (await exists(LETTER_STORE)) ? [] : [LETTER_STORE];
  for (const [key, data] of Object.entries(SEED)) {
    const file = path.join(CONTENT_DIR, `${key}.json`);
    try {
      await fs.writeFile(file, JSON.stringify({ data, updatedAt: new Date().toISOString() }), {
        flag: "wx",
      });
      seeded.push(file);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    }
  }
  await fs.writeFile(SEEDED_MANIFEST, JSON.stringify(seeded));
}
