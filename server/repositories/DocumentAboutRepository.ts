import type { About, AboutContent, UpdateAboutInput } from "@/server/domain/entities";
import { AboutRepository } from "./AboutRepository";
import type { DocumentStore } from "./document/DocumentStore";
import { SingletonDocument } from "./document/SingletonDocument";

const ABOUT_ID = "about";

/** JSON shape on disk/in JSONB: dates are ISO strings. */
type StoredAbout = Omit<AboutContent, "experience" | "certifications"> & {
  experience: (Omit<AboutContent["experience"][number], "startDate" | "endDate"> & {
    startDate: string;
    endDate?: string;
  })[];
  certifications: (Omit<AboutContent["certifications"][number], "issuedAt" | "expiresAt"> & {
    issuedAt: string;
    expiresAt?: string;
  })[];
};

const iso = (d: Date | undefined) => (d ? new Date(d).toISOString() : undefined);
const date = (s: string | undefined) => (s ? new Date(s) : undefined);

export class DocumentAboutRepository extends AboutRepository {
  private readonly doc: SingletonDocument<AboutContent, StoredAbout>;

  constructor(store: DocumentStore) {
    super();
    this.doc = new SingletonDocument<AboutContent, StoredAbout>(store, "about", {
      encode: (value) => ({
        ...value,
        experience: value.experience.map((e) => ({ ...e, startDate: iso(e.startDate) as string, endDate: iso(e.endDate) })),
        certifications: value.certifications.map((c) => ({
          ...c,
          issuedAt: iso(c.issuedAt) as string,
          expiresAt: iso(c.expiresAt),
        })),
      }),
      decode: (stored, updatedAt) => ({
        biography: stored.biography ?? "",
        skills: stored.skills ?? [],
        education: stored.education ?? [],
        awards: stored.awards ?? [],
        experience: (stored.experience ?? []).map((e) => ({
          ...e,
          startDate: new Date(e.startDate),
          endDate: date(e.endDate),
        })),
        certifications: (stored.certifications ?? []).map((c) => ({
          ...c,
          issuedAt: new Date(c.issuedAt),
          expiresAt: date(c.expiresAt),
        })),
        updatedAt,
      }),
    });
  }

  async getAbout(): Promise<About | null> {
    const about = await this.doc.read();
    return about && { id: ABOUT_ID, ...about };
  }

  async save(content: AboutContent): Promise<About> {
    return { id: ABOUT_ID, ...(await this.doc.write(content)) };
  }

  async findById(id: string): Promise<About | null> {
    return id === ABOUT_ID ? this.getAbout() : null;
  }

  async update(id: string, input: UpdateAboutInput): Promise<About | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const { id: _id, updatedAt: _updatedAt, ...content } = existing;
    return this.save({ ...content, ...input });
  }

  async delete(): Promise<boolean> {
    throw new Error("AboutRepository does not support delete — save empty content instead.");
  }
}
