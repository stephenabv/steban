import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { CreateManagedFileInput, ManagedFile, ManagedFileContent } from "@/server/domain/entities";
import { ManagedFileRepository } from "./ManagedFileRepository";

/**
 * File-backed repository for local development (no DATABASE_URL/POSTGRES_URL).
 * Not suitable for serverless production — the filesystem there is ephemeral.
 */
export type ManagedFileDir = "resume" | "profile-photo";

type StoredMeta = Omit<ManagedFile, "uploadedAt"> & { uploadedAt: string };

export class JsonManagedFileRepository extends ManagedFileRepository {
  private readonly dir: string;
  private readonly metaFile: string;

  constructor(dir: ManagedFileDir) {
    super();
    this.dir = path.join(process.cwd(), "data", dir);
    this.metaFile = path.join(this.dir, "active.json");
  }

  private contentPath(id: string): string {
    return path.join(this.dir, `${id}.bin`);
  }

  async findActive(): Promise<ManagedFile | null> {
    try {
      const meta = JSON.parse(await fs.readFile(this.metaFile, "utf-8")) as StoredMeta;
      return { ...meta, uploadedAt: new Date(meta.uploadedAt) };
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }

  async findActiveContent(): Promise<ManagedFileContent | null> {
    const meta = await this.findActive();
    if (!meta) return null;
    return { ...meta, content: await fs.readFile(this.contentPath(meta.id)) };
  }

  /** Write the new file first, atomically swap the pointer, then remove the old file. */
  async replaceActive(input: CreateManagedFileInput): Promise<ManagedFile> {
    await fs.mkdir(this.dir, { recursive: true });
    const previous = await this.findActive();
    const meta: ManagedFile = {
      id: randomUUID(),
      fileName: input.fileName,
      contentType: input.contentType,
      sizeBytes: input.content.length,
      sha256: input.sha256,
      uploadedAt: new Date(),
    };
    await fs.writeFile(this.contentPath(meta.id), input.content);
    const tmp = `${this.metaFile}.${meta.id}.tmp`;
    await fs.writeFile(tmp, JSON.stringify({ ...meta, uploadedAt: meta.uploadedAt.toISOString() }, null, 2));
    await fs.rename(tmp, this.metaFile);
    if (previous) await fs.rm(this.contentPath(previous.id), { force: true });
    return meta;
  }

  async clearActive(): Promise<boolean> {
    const previous = await this.findActive();
    if (!previous) return false;
    await fs.rm(this.metaFile, { force: true });
    await fs.rm(this.contentPath(previous.id), { force: true });
    return true;
  }
}
