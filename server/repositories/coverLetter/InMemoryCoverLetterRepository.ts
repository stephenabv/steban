import { randomUUID } from "crypto";
import type { CoverLetterStatus } from "@/server/domain/coverLetter";
import type {
  CoverLetterPatch,
  CoverLetterRecord,
  CoverLetterSummary,
  NewCoverLetter,
} from "./CoverLetterRepository";
import { COVER_LETTER_LIST_LIMIT, CoverLetterRepository } from "./CoverLetterRepository";

interface Mutation<T> {
  result: T;
  changed: boolean;
}

/**
 * Process-local repository. Used directly by tests; subclasses override
 * `load`/`persist` to add durable storage (see JsonCoverLetterRepository).
 * Mutations run one at a time, so read-modify-write cycles never interleave.
 */
export class InMemoryCoverLetterRepository extends CoverLetterRepository {
  private records: CoverLetterRecord[] = [];
  private queue: Promise<unknown> = Promise.resolve();

  protected async load(): Promise<CoverLetterRecord[]> {
    return structuredClone(this.records);
  }

  protected async persist(records: CoverLetterRecord[]): Promise<void> {
    this.records = structuredClone(records);
  }

  async create(
    ownerId: string,
    { application, content }: NewCoverLetter
  ): Promise<CoverLetterRecord> {
    const now = new Date();
    const applicationId = randomUUID();
    const record: CoverLetterRecord = {
      application: { ...application, id: applicationId, ownerId, createdAt: now, updatedAt: now },
      letter: {
        ...content,
        id: randomUUID(),
        ownerId,
        applicationId,
        status: "draft",
        createdAt: now,
        updatedAt: now,
      },
    };
    return this.mutate((records) => {
      records.push(record);
      return { result: structuredClone(record), changed: true };
    });
  }

  async findById(ownerId: string, id: string): Promise<CoverLetterRecord | null> {
    return (
      (await this.load()).find((r) => r.letter.id === id && r.letter.ownerId === ownerId) ?? null
    );
  }

  async list(ownerId: string): Promise<CoverLetterSummary[]> {
    return (await this.load())
      .filter((record) => record.letter.ownerId === ownerId)
      .sort((a, b) => b.letter.updatedAt.getTime() - a.letter.updatedAt.getTime())
      .slice(0, COVER_LETTER_LIST_LIMIT)
      .map((record) => CoverLetterRepository.summarize(record));
  }

  async update(
    ownerId: string,
    id: string,
    patch: CoverLetterPatch,
    allowedStatuses: readonly CoverLetterStatus[]
  ): Promise<CoverLetterRecord | null> {
    return this.mutate((records) => {
      const index = records.findIndex((r) => r.letter.id === id && r.letter.ownerId === ownerId);
      const current = records[index];
      if (!current || !allowedStatuses.includes(current.letter.status)) {
        return { result: null, changed: false };
      }
      const now = new Date();
      const updated: CoverLetterRecord = {
        letter: {
          ...current.letter,
          ...patch.content,
          status: patch.status ?? current.letter.status,
          updatedAt: now,
        },
        application: patch.application
          ? { ...current.application, ...patch.application, updatedAt: now }
          : current.application,
      };
      records[index] = updated;
      return { result: structuredClone(updated), changed: true };
    });
  }

  async delete(ownerId: string, id: string): Promise<boolean> {
    return this.mutate((records) => {
      const index = records.findIndex((r) => r.letter.id === id && r.letter.ownerId === ownerId);
      if (index === -1) return { result: false, changed: false };
      records.splice(index, 1);
      return { result: true, changed: true };
    });
  }

  /** Serialises read-modify-write cycles; a failed step doesn't block later ones. */
  private mutate<T>(work: (records: CoverLetterRecord[]) => Mutation<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const records = await this.load();
      const { result, changed } = work(records);
      if (changed) await this.persist(records);
      return result;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }
}
