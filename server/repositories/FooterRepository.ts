import type { FooterContent, FooterSettings } from "@/server/domain/entities";

export abstract class FooterRepository {
  abstract get(): Promise<FooterSettings | null>;
  abstract save(content: FooterContent): Promise<FooterSettings>;
}
