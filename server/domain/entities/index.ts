export type { Project, CreateProjectInput, UpdateProjectInput } from "./Project";
export type {
  About,
  Skill,
  EducationEntry,
  ExperienceEntry,
  Certification,
  Award,
  AboutContent,
  UpdateAboutInput,
} from "./About";
export type { Hero, HeroContent, UpdateHeroInput } from "./Hero";
export type {
  ContactInfo,
  ContactMessage,
  CreateContactMessageInput,
  ContactInfoContent,
  UpdateContactInfoInput,
} from "./Contact";
export type { SeoMetadata, SeoContent, SeoPageKey, UpdateSeoMetadataInput } from "./SeoMetadata";
export { SEO_PAGE_KEYS } from "./SeoMetadata";
export type { FooterSettings, FooterContent } from "./Footer";
export type { ManagedFile, ManagedFileContent, CreateManagedFileInput } from "./ManagedFile";
export type { ResumeFile, ResumeFileContent, CreateResumeFileInput } from "./Resume";
export type {
  LegalDocumentKind,
  LegalDocumentVersion,
  LegalDraftContent,
  LegalVersionStatus,
} from "./LegalDocument";
export { LEGAL_DOCUMENT_KINDS, LEGAL_VERSION_STATUSES, isLegalDocumentKind } from "./LegalDocument";
