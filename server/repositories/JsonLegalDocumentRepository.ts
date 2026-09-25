import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type {
  LegalDocumentKind,
  LegalDocumentVersion,
  LegalDraftContent,
} from "@/server/domain/entities";
import { LegalVersionLifecycle, type LegalVersionAction } from "@/server/domain/legal/LegalVersionLifecycle";
import { LegalDocumentRepository } from "./LegalDocumentRepository";

type DateKeys = "createdAt" | "updatedAt" | "publishedAt" | "unpublishedAt";
type StoredVersion = Omit<LegalDocumentVersion, DateKeys> & {
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  unpublishedAt: string | null;
};

const FILE = path.join(process.cwd(), "data", "legal-versions.json");

function revive(s: StoredVersion): LegalDocumentVersion {
  return {
    ...s,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
    publishedAt: s.publishedAt ? new Date(s.publishedAt) : null,
    unpublishedAt: s.unpublishedAt ? new Date(s.unpublishedAt) : null,
  };
}

/**
 * File-backed repository for local development (no DATABASE_URL/POSTGRES_URL).
 * Mutations run one at a time through an in-process queue and the file is
 * replaced atomically, mirroring the Postgres transaction semantics.
 */
export class JsonLegalDocumentRepository extends LegalDocumentRepository {
  private queue: Promise<unknown> = Promise.resolve();

  private async readAll(): Promise<StoredVersion[]> {
    try {
      return JSON.parse(await fs.readFile(FILE, "utf-8")) as StoredVersion[];
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw e;
    }
  }

  private async writeAll(all: StoredVersion[]): Promise<void> {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    const tmp = `${FILE}.${randomUUID()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(all, null, 2), "utf-8");
    await fs.rename(tmp, FILE);
  }

  /** Serialises read-modify-write cycles; a failed step doesn't block later ones. */
  private mutate<T>(work: (all: StoredVersion[]) => { result: T; changed: boolean }): Promise<T> {
    const run = this.queue.then(async () => {
      const all = await this.readAll();
      const { result, changed } = work(all);
      if (changed) await this.writeAll(all);
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  private static findAllowed(all: StoredVersion[], id: string, action: LegalVersionAction): StoredVersion | undefined {
    const version = all.find((v) => v.id === id);
    return version && LegalVersionLifecycle.can(version.status, action) ? version : undefined;
  }

  async listByKind(kind: LegalDocumentKind): Promise<LegalDocumentVersion[]> {
    return (await this.readAll())
      .filter((v) => v.kind === kind)
      .sort((a, b) => b.versionNumber - a.versionNumber)
      .map(revive);
  }

  async findById(id: string): Promise<LegalDocumentVersion | null> {
    const found = (await this.readAll()).find((v) => v.id === id);
    return found ? revive(found) : null;
  }

  async findPublished(kind: LegalDocumentKind): Promise<LegalDocumentVersion | null> {
    const found = (await this.readAll()).find((v) => v.kind === kind && v.status === "published");
    return found ? revive(found) : null;
  }

  createDraft(kind: LegalDocumentKind, content: LegalDraftContent): Promise<LegalDocumentVersion> {
    return this.mutate((all) => {
      const now = new Date().toISOString();
      const versionNumber = Math.max(0, ...all.filter((v) => v.kind === kind).map((v) => v.versionNumber)) + 1;
      const draft: StoredVersion = {
        id: randomUUID(),
        kind,
        versionNumber,
        ...content,
        status: "draft",
        createdAt: now,
        updatedAt: now,
        publishedAt: null,
        unpublishedAt: null,
      };
      all.push(draft);
      return { result: revive(draft), changed: true };
    });
  }

  updateDraft(id: string, content: LegalDraftContent): Promise<LegalDocumentVersion | null> {
    return this.mutate((all) => {
      const version = JsonLegalDocumentRepository.findAllowed(all, id, "edit");
      if (!version) return { result: null, changed: false };
      Object.assign(version, content, { updatedAt: new Date().toISOString() });
      return { result: revive(version), changed: true };
    });
  }

  publish(id: string): Promise<LegalDocumentVersion | null> {
    return this.mutate((all) => {
      const version = JsonLegalDocumentRepository.findAllowed(all, id, "publish");
      if (!version) return { result: null, changed: false };
      const now = new Date().toISOString();
      for (const other of all) {
        if (other.kind === version.kind && other.status === "published") {
          Object.assign(other, { status: "unpublished", unpublishedAt: now, updatedAt: now });
        }
      }
      Object.assign(version, { status: "published", publishedAt: now, unpublishedAt: null, updatedAt: now });
      return { result: revive(version), changed: true };
    });
  }

  unpublish(id: string): Promise<LegalDocumentVersion | null> {
    return this.mutate((all) => {
      const version = JsonLegalDocumentRepository.findAllowed(all, id, "unpublish");
      if (!version) return { result: null, changed: false };
      const now = new Date().toISOString();
      Object.assign(version, { status: "unpublished", unpublishedAt: now, updatedAt: now });
      return { result: revive(version), changed: true };
    });
  }

  delete(id: string): Promise<boolean> {
    return this.mutate((all) => {
      const version = JsonLegalDocumentRepository.findAllowed(all, id, "delete");
      if (!version) return { result: false, changed: false };
      all.splice(all.indexOf(version), 1);
      return { result: true, changed: true };
    });
  }
}
