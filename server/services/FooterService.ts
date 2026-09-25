import type { FooterContent, FooterSettings } from "@/server/domain/entities";
import type { Result } from "@/server/domain/types";
import { ok, err } from "@/server/domain/types";
import type { FooterRepository } from "@/server/repositories";

export class FooterService {
  constructor(private readonly repo: FooterRepository) {}

  async get(): Promise<Result<FooterSettings | null>> {
    try {
      return ok(await this.repo.get());
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async save(content: FooterContent): Promise<Result<FooterSettings>> {
    try {
      return ok(await this.repo.save(content));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
