import type { DocumentStore } from "./DocumentStore";

/**
 * One keyed document with a codec: `encode` maps the domain value to its
 * JSON-safe stored shape, `decode` revives it (e.g. ISO strings → Date).
 * Shared by the singleton repositories so each only declares its mapping.
 */
export class SingletonDocument<TValue, TStored = TValue> {
  constructor(
    private readonly store: DocumentStore,
    private readonly key: string,
    private readonly codec: {
      encode: (value: TValue) => TStored;
      decode: (stored: TStored, updatedAt: Date) => TValue & { updatedAt: Date };
    }
  ) {}

  async read(): Promise<(TValue & { updatedAt: Date }) | null> {
    const doc = await this.store.read<TStored>(this.key);
    return doc ? this.codec.decode(doc.data, doc.updatedAt) : null;
  }

  async write(value: TValue): Promise<TValue & { updatedAt: Date }> {
    const doc = await this.store.write(this.key, this.codec.encode(value));
    return this.codec.decode(doc.data, doc.updatedAt);
  }
}
