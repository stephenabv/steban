import type { FooterContent, FooterSettings } from "@/server/domain/entities";
import { FooterRepository } from "./FooterRepository";
import type { DocumentStore } from "./document/DocumentStore";
import { SingletonDocument } from "./document/SingletonDocument";

export class DocumentFooterRepository extends FooterRepository {
  private readonly doc: SingletonDocument<FooterContent>;

  constructor(store: DocumentStore) {
    super();
    this.doc = new SingletonDocument<FooterContent>(store, "footer", {
      encode: (value) => value,
      decode: (stored, updatedAt) => ({ ...stored, updatedAt }),
    });
  }

  get(): Promise<FooterSettings | null> {
    return this.doc.read();
  }

  save(content: FooterContent): Promise<FooterSettings> {
    return this.doc.write(content);
  }
}
