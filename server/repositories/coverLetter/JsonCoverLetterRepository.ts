import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { CoverLetter, JobApplication } from "@/server/domain/coverLetter";
import type { CoverLetterRecord } from "./CoverLetterRepository";
import { InMemoryCoverLetterRepository } from "./InMemoryCoverLetterRepository";

type DateKeys = "createdAt" | "updatedAt";
type Stored<T> = Omit<T, DateKeys> & { createdAt: string; updatedAt: string };
interface StoredRecord {
  letter: Stored<CoverLetter>;
  application: Stored<JobApplication>;
}

const FILE = path.join(process.cwd(), "data", "cover-letters.json");

const revive = <T extends { createdAt: Date; updatedAt: Date }>(stored: Stored<T>): T =>
  ({
    ...stored,
    createdAt: new Date(stored.createdAt),
    updatedAt: new Date(stored.updatedAt),
  }) as T;

const store = <T extends { createdAt: Date; updatedAt: Date }>(value: T): Stored<T> => ({
  ...value,
  createdAt: value.createdAt.toISOString(),
  updatedAt: value.updatedAt.toISOString(),
});

/**
 * File-backed repository for local development (no DATABASE_URL/POSTGRES_URL).
 * Not suitable for serverless production: that filesystem is ephemeral.
 * The file lives under data/, which is git-ignored.
 */
export class JsonCoverLetterRepository extends InMemoryCoverLetterRepository {
  protected override async load(): Promise<CoverLetterRecord[]> {
    try {
      const stored = JSON.parse(await fs.readFile(FILE, "utf-8")) as StoredRecord[];
      return stored.map((record) => ({
        letter: revive<CoverLetter>(record.letter),
        application: revive<JobApplication>(record.application),
      }));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw e;
    }
  }

  protected override async persist(records: CoverLetterRecord[]): Promise<void> {
    const stored: StoredRecord[] = records.map((record) => ({
      letter: store(record.letter),
      application: store(record.application),
    }));
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    // Write-then-rename so a crash never leaves a half-written file.
    const tmp = `${FILE}.${randomUUID()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(stored, null, 2), "utf-8");
    await fs.rename(tmp, FILE);
  }
}
