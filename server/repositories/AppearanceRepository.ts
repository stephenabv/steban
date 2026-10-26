import type { AppearanceContent, AppearanceSettings } from "@/server/domain/entities";

export abstract class AppearanceRepository {
  abstract get(): Promise<AppearanceSettings | null>;
  abstract save(content: AppearanceContent): Promise<AppearanceSettings>;
}
