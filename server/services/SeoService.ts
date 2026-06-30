import type { SeoMetadata, UpdateSeoMetadataInput } from "@/server/domain/entities";
import type { Result } from "@/server/domain/types";
import { ok, err } from "@/server/domain/types";
import type { SeoRepository } from "@/server/repositories";

export class SeoService {
  constructor(private readonly repo: SeoRepository) {}

  async getByPageKey(pageKey: string): Promise<Result<SeoMetadata | null>> {
    try {
      return ok(await this.repo.findByPageKey(pageKey));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async update(id: string, input: UpdateSeoMetadataInput): Promise<Result<SeoMetadata | null>> {
    try {
      return ok(await this.repo.update(id, input));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
