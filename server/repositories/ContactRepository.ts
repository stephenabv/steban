import type {
  ContactInfo,
  ContactMessage,
  CreateContactMessageInput,
  UpdateContactInfoInput,
} from "@/server/domain/entities";
import type { Paginated } from "@/server/domain/types";
import { BaseRepository } from "./BaseRepository";

export abstract class ContactInfoRepository extends BaseRepository<
  ContactInfo,
  never,
  UpdateContactInfoInput
> {
  abstract getContactInfo(): Promise<ContactInfo | null>;
  create(_input: never): Promise<ContactInfo> {
    throw new Error("ContactInfoRepository does not support create — use update.");
  }
  findAll(): Promise<Paginated<ContactInfo>> {
    throw new Error("ContactInfoRepository does not support findAll.");
  }
}

export abstract class ContactMessageRepository extends BaseRepository<
  ContactMessage,
  CreateContactMessageInput,
  { read: boolean }
> {
  abstract findAll(params?: { page?: number; pageSize?: number }): Promise<Paginated<ContactMessage>>;
  abstract markAsRead(id: string): Promise<boolean>;
}
