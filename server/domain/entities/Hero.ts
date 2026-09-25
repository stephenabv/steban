export interface Hero {
  id: string;
  name: string;
  title: string;
  introduction: string;
  photoUrl: string;
  photoAlt: string;
  updatedAt: Date;
}

export type UpdateHeroInput = Partial<Omit<Hero, "id" | "updatedAt">>;

/** Editable hero fields (the singleton's identity and timestamp are managed by storage). */
export type HeroContent = Omit<Hero, "id" | "updatedAt">;
