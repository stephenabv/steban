import { promises as fs } from "node:fs";
import { SEEDED_MANIFEST } from "./globalSetup";

export default async function globalTeardown(): Promise<void> {
  try {
    const seeded = JSON.parse(await fs.readFile(SEEDED_MANIFEST, "utf8")) as string[];
    await Promise.all(seeded.map((file) => fs.rm(file, { force: true })));
    await fs.rm(SEEDED_MANIFEST, { force: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
