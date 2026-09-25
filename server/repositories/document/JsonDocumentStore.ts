import { promises as fs } from "fs";
import path from "path";
import { DocumentStore } from "./DocumentStore";
import type { StoredDocument } from "./DocumentStore";

/**
 * File-backed document store for local development (no DATABASE_URL/POSTGRES_URL).
 * Not suitable for serverless production — the filesystem there is ephemeral.
 */
const DIR = path.join(process.cwd(), "data", "content");

type StoredFile<T> = { data: T; updatedAt: string };

export class JsonDocumentStore extends DocumentStore {
  async read<T>(key: string): Promise<StoredDocument<T> | null> {
    this.assertKey(key);
    try {
      const file = JSON.parse(await fs.readFile(path.join(DIR, `${key}.json`), "utf-8")) as StoredFile<T>;
      return { data: file.data, updatedAt: new Date(file.updatedAt) };
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }

  async write<T>(key: string, data: T): Promise<StoredDocument<T>> {
    this.assertKey(key);
    await fs.mkdir(DIR, { recursive: true });
    const updatedAt = new Date();
    const target = path.join(DIR, `${key}.json`);
    // Write-then-rename so a crash never leaves a half-written document.
    const tmp = `${target}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify({ data, updatedAt: updatedAt.toISOString() }, null, 2), "utf-8");
    await fs.rename(tmp, target);
    return { data, updatedAt };
  }
}
