import "server-only";
import { AboutService } from "./AboutService";
import { FooterService } from "./FooterService";
import { HeroService } from "./HeroService";
import { SeoService } from "./SeoService";
import { getDocumentStore } from "@/server/repositories/document/documentStore.instance";
import { DocumentAboutRepository } from "@/server/repositories/DocumentAboutRepository";
import { DocumentFooterRepository } from "@/server/repositories/DocumentFooterRepository";
import { DocumentHeroRepository } from "@/server/repositories/DocumentHeroRepository";
import { DocumentSeoRepository } from "@/server/repositories/DocumentSeoRepository";

/**
 * Singletons for editable site content. All share one DocumentStore, which is
 * Postgres in production (DATABASE_URL/POSTGRES_URL) and JSON files locally.
 */
let hero: HeroService | null = null;
let about: AboutService | null = null;
let seo: SeoService | null = null;
let footer: FooterService | null = null;

export function getHeroService(): HeroService {
  hero ??= new HeroService(new DocumentHeroRepository(getDocumentStore()));
  return hero;
}

export function getAboutService(): AboutService {
  about ??= new AboutService(new DocumentAboutRepository(getDocumentStore()));
  return about;
}

export function getSeoService(): SeoService {
  seo ??= new SeoService(new DocumentSeoRepository(getDocumentStore()));
  return seo;
}

export function getFooterService(): FooterService {
  footer ??= new FooterService(new DocumentFooterRepository(getDocumentStore()));
  return footer;
}
