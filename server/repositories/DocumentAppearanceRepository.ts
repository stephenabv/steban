import type { AppearanceContent, AppearanceSettings } from "@/server/domain/entities";
import { DEFAULT_GRADIENT_STOPS, isValidGradientStops } from "@/lib/theme/gradient";
import { AppearanceRepository } from "./AppearanceRepository";
import type { DocumentStore } from "./document/DocumentStore";
import { SingletonDocument } from "./document/SingletonDocument";

export class DocumentAppearanceRepository extends AppearanceRepository {
  private readonly doc: SingletonDocument<AppearanceContent>;

  constructor(store: DocumentStore) {
    super();
    this.doc = new SingletonDocument<AppearanceContent>(store, "appearance", {
      encode: (value) => ({ gradientStops: [...value.gradientStops] }),
      // The stops are written into CSS on every page: a stored value that is no
      // longer valid (edited by hand, older shape) falls back to the default.
      decode: (stored, updatedAt) => ({
        gradientStops: isValidGradientStops(stored?.gradientStops)
          ? [...stored.gradientStops]
          : [...DEFAULT_GRADIENT_STOPS],
        updatedAt,
      }),
    });
  }

  get(): Promise<AppearanceSettings | null> {
    return this.doc.read();
  }

  save(content: AppearanceContent): Promise<AppearanceSettings> {
    return this.doc.write(content);
  }
}
