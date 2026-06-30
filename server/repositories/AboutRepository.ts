import type { About, UpdateAboutInput } from "@/server/domain/entities";
import type { Paginated } from "@/server/domain/types";
import { BaseRepository } from "./BaseRepository";

export abstract class AboutRepository extends BaseRepository<About, never, UpdateAboutInput> {
  abstract getAbout(): Promise<About | null>;
  create(_input: never): Promise<About> {
    throw new Error("AboutRepository does not support create — use update.");
  }
  findAll(): Promise<Paginated<About>> {
    throw new Error("AboutRepository does not support findAll.");
  }
}
