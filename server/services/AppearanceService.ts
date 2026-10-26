import type { AppearanceContent, AppearanceSettings } from "@/server/domain/entities";
import type { Result } from "@/server/domain/types";
import { ok, err } from "@/server/domain/types";
import type { AppearanceRepository } from "@/server/repositories";

export class AppearanceService {
  constructor(private readonly repo: AppearanceRepository) {}

  async get(): Promise<Result<AppearanceSettings | null>> {
    try {
      return ok(await this.repo.get());
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async save(content: AppearanceContent): Promise<Result<AppearanceSettings>> {
    try {
      return ok(await this.repo.save(content));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
