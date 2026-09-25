import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { CreateResumeFileInput, ResumeFile, ResumeFileContent } from "@/server/domain/entities";
import { ResumeRepository } from "./ResumeRepository";

/**
 * File-backed repository for local development (no DATABASE_URL/POSTGRES_URL).
 * Not suitable for serverless production — the filesystem there is ephemeral.
 */
const DIR = path.join(process.cwd(), "data", "resume");
const META_FILE = path.join(DIR, "active.json");

type StoredMeta = Omit<ResumeFile, "uploadedAt"> & { uploadedAt: string };

const contentPath = (id: string) => path.join(DIR, `${id}.pdf`);

export class JsonResumeRepository extends ResumeRepository {
  async findActive(): Promise<ResumeFile | null> {
    try {
      const meta = JSON.parse(await fs.readFile(META_FILE, "utf-8")) as StoredMeta;
      return { ...meta, uploadedAt: new Date(meta.uploadedAt) };
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }

  async findActiveContent(): Promise<ResumeFileContent | null> {
    const meta = await this.findActive();
    if (!meta) return null;
    return { ...meta, content: await fs.readFile(contentPath(meta.id)) };
  }

  /** Write the new file first, atomically swap the pointer, then remove the old file. */
  async replaceActive(input: CreateResumeFileInput): Promise<ResumeFile> {
    await fs.mkdir(DIR, { recursive: true });
    const previous = await this.findActive();
    const meta: ResumeFile = {
      id: randomUUID(),
      fileName: input.fileName,
      contentType: input.contentType,
      sizeBytes: input.content.length,
      sha256: input.sha256,
      uploadedAt: new Date(),
    };
    await fs.writeFile(contentPath(meta.id), input.content);
    const tmp = `${META_FILE}.${meta.id}.tmp`;
    await fs.writeFile(tmp, JSON.stringify({ ...meta, uploadedAt: meta.uploadedAt.toISOString() }, null, 2));
    await fs.rename(tmp, META_FILE);
    if (previous) await fs.rm(contentPath(previous.id), { force: true });
    return meta;
  }
}
