import type { Hero, HeroContent, UpdateHeroInput } from "@/server/domain/entities";
import { HeroRepository } from "./HeroRepository";
import type { DocumentStore } from "./document/DocumentStore";
import { SingletonDocument } from "./document/SingletonDocument";

const HERO_ID = "hero";

export class DocumentHeroRepository extends HeroRepository {
  private readonly doc: SingletonDocument<HeroContent>;

  constructor(store: DocumentStore) {
    super();
    this.doc = new SingletonDocument<HeroContent>(store, "hero", {
      encode: (value) => value,
      decode: (stored, updatedAt) => ({ ...stored, updatedAt }),
    });
  }

  async getHero(): Promise<Hero | null> {
    const hero = await this.doc.read();
    return hero && { id: HERO_ID, ...hero };
  }

  async save(content: HeroContent): Promise<Hero> {
    return { id: HERO_ID, ...(await this.doc.write(content)) };
  }

  async findById(id: string): Promise<Hero | null> {
    return id === HERO_ID ? this.getHero() : null;
  }

  async update(id: string, input: UpdateHeroInput): Promise<Hero | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const { id: _id, updatedAt: _updatedAt, ...content } = existing;
    return this.save({ ...content, ...input });
  }

  async delete(): Promise<boolean> {
    throw new Error("HeroRepository does not support delete — save empty content instead.");
  }
}
