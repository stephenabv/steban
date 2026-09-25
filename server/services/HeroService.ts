import type { Hero, HeroContent, UpdateHeroInput } from "@/server/domain/entities";
import type { Result } from "@/server/domain/types";
import { ok, err } from "@/server/domain/types";
import type { HeroRepository } from "@/server/repositories";

export class HeroService {
  constructor(private readonly repo: HeroRepository) {}

  async getHero(): Promise<Result<Hero | null>> {
    try {
      return ok(await this.repo.getHero());
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async save(content: HeroContent): Promise<Result<Hero>> {
    try {
      return ok(await this.repo.save(content));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async update(id: string, input: UpdateHeroInput): Promise<Result<Hero | null>> {
    try {
      return ok(await this.repo.update(id, input));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
