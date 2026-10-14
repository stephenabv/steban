import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { CreatePasskeyInput, Passkey } from "@/server/domain/entities";
import {
  PasskeyAlreadyExistsError,
  PasskeyRepository,
  isCounterAdvance,
} from "./PasskeyRepository";

type StoredPasskey = Omit<Passkey, "publicKey" | "createdAt" | "lastUsedAt"> & {
  publicKey: string;
  createdAt: string;
  lastUsedAt: string | null;
};

function toPasskey(stored: StoredPasskey): Passkey {
  return {
    ...stored,
    publicKey: new Uint8Array(Buffer.from(stored.publicKey, "base64url")),
    createdAt: new Date(stored.createdAt),
    lastUsedAt: stored.lastUsedAt ? new Date(stored.lastUsedAt) : null,
  };
}

function toStored(passkey: Passkey): StoredPasskey {
  return {
    ...passkey,
    publicKey: Buffer.from(passkey.publicKey).toString("base64url"),
    createdAt: passkey.createdAt.toISOString(),
    lastUsedAt: passkey.lastUsedAt?.toISOString() ?? null,
  };
}

/**
 * File-backed repository for local development (no DATABASE_URL/POSTGRES_URL).
 * Not suitable for serverless production — the filesystem there is ephemeral.
 */
export class JsonPasskeyRepository extends PasskeyRepository {
  /** Serializes read-modify-write cycles within this process. */
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly file = path.join(process.cwd(), "data", "passkeys.json")) {
    super();
  }

  async findById(id: string): Promise<Passkey | null> {
    const stored = (await this.readAll()).find((p) => p.id === id);
    return stored ? toPasskey(stored) : null;
  }

  async listByOwner(ownerId: string): Promise<Passkey[]> {
    return (await this.readAll())
      .filter((p) => p.ownerId === ownerId)
      .map(toPasskey)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  create(input: CreatePasskeyInput): Promise<Passkey> {
    return this.mutate((all) => {
      if (all.some((p) => p.id === input.id)) throw new PasskeyAlreadyExistsError();
      const passkey: Passkey = { ...input, createdAt: new Date(), lastUsedAt: null };
      return { next: [...all, toStored(passkey)], result: passkey };
    });
  }

  recordUse(id: string, counter: number, usedAt: Date): Promise<boolean> {
    return this.mutate((all) => {
      const index = all.findIndex((p) => p.id === id);
      if (index === -1 || !isCounterAdvance(all[index].counter, counter))
        return { next: all, result: false };
      const next = [...all];
      next[index] = { ...all[index], counter, lastUsedAt: usedAt.toISOString() };
      return { next, result: true };
    });
  }

  delete(ownerId: string, id: string): Promise<boolean> {
    return this.mutate((all) => {
      const next = all.filter((p) => !(p.id === id && p.ownerId === ownerId));
      return { next, result: next.length !== all.length };
    });
  }

  private async readAll(): Promise<StoredPasskey[]> {
    try {
      return JSON.parse(await fs.readFile(this.file, "utf-8")) as StoredPasskey[];
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw e;
    }
  }

  private mutate<T>(
    change: (all: StoredPasskey[]) => { next: StoredPasskey[]; result: T }
  ): Promise<T> {
    const run = this.queue.then(async () => {
      const all = await this.readAll();
      const { next, result } = change(all);
      if (next !== all) await this.writeAll(next);
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }

  /** Replaces the file atomically (write to a temp file, then rename). */
  private async writeAll(all: StoredPasskey[]): Promise<void> {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.${randomUUID()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(all, null, 2), { mode: 0o600 });
    await fs.rename(tmp, this.file);
  }
}
