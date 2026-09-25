export interface ContactInfo {
  id: string;
  email: string;
  githubUrl: string;
  linkedinUrl: string;
  facebookUrl: string;
  updatedAt: Date;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  ip?: string;
  createdAt: Date;
  read: boolean;
}

export type CreateContactMessageInput = Pick<
  ContactMessage,
  "name" | "email" | "subject" | "message" | "ip"
>;

export type UpdateContactInfoInput = Partial<Omit<ContactInfo, "id" | "updatedAt">>;
