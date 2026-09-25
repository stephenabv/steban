export interface Skill {
  id: string;
  name: string;
  category: string;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5;
  order: number;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startYear: number;
  endYear?: number;
  description?: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  startDate: Date;
  endDate?: Date;
  current: boolean;
  description: string;
  technologies: string[];
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issuedAt: Date;
  expiresAt?: Date;
  credentialUrl?: string;
}

export interface Award {
  id: string;
  title: string;
  issuer: string;
  year: number;
  description?: string;
}

export interface About {
  id: string;
  biography: string;
  skills: Skill[];
  education: EducationEntry[];
  experience: ExperienceEntry[];
  certifications: Certification[];
  awards: Award[];
  updatedAt: Date;
}

export type UpdateAboutInput = Partial<Omit<About, "id" | "updatedAt">>;

/** Editable about fields (the singleton's identity and timestamp are managed by storage). */
export type AboutContent = Omit<About, "id" | "updatedAt">;
