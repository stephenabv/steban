import type { About, AboutContent, UpdateAboutInput } from "@/server/domain/entities";
import type { Result } from "@/server/domain/types";
import { ok, err } from "@/server/domain/types";
import type { AboutRepository } from "@/server/repositories";

export class AboutService {
  constructor(private readonly repo: AboutRepository) {}

  async getAbout(): Promise<Result<About | null>> {
    try {
      return ok(await this.repo.getAbout());
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async save(content: AboutContent): Promise<Result<About>> {
    try {
      return ok(await this.repo.save(content));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async update(id: string, input: UpdateAboutInput): Promise<Result<About | null>> {
    try {
      return ok(await this.repo.update(id, input));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
