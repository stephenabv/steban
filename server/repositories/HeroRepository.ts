import type { Hero, UpdateHeroInput } from "@/server/domain/entities";
import type { Paginated } from "@/server/domain/types";
import { BaseRepository } from "./BaseRepository";

export abstract class HeroRepository extends BaseRepository<Hero, never, UpdateHeroInput> {
  abstract getHero(): Promise<Hero | null>;
  create(_input: never): Promise<Hero> {
    throw new Error("HeroRepository does not support create — use update.");
  }
  findAll(): Promise<Paginated<Hero>> {
    throw new Error("HeroRepository does not support findAll.");
  }
}
