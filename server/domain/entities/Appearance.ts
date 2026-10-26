/** Site-wide look the admin controls. */
export interface AppearanceSettings {
  /** Decorative gradient colours, `#rrggbb`, in ring order (2–6 stops). */
  gradientStops: string[];
  updatedAt: Date;
}

export type AppearanceContent = Omit<AppearanceSettings, "updatedAt">;
