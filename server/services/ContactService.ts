import type {
  ContactInfo,
  ContactInfoContent,
  ContactMessage,
  CreateContactMessageInput,
  UpdateContactInfoInput,
} from "@/server/domain/entities";
import type { Paginated, PaginationParams, Result } from "@/server/domain/types";
import { ok, err } from "@/server/domain/types";
import type { ContactInfoRepository, ContactMessageRepository } from "@/server/repositories";

export class ContactService {
  constructor(
    private readonly infoRepo: ContactInfoRepository,
    private readonly messageRepo: ContactMessageRepository
  ) {}

  async getContactInfo(): Promise<Result<ContactInfo | null>> {
    try {
      return ok(await this.infoRepo.getContactInfo());
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  /** Creates the settings row on first save, updates it afterwards. */
  async saveContactInfo(content: ContactInfoContent): Promise<Result<ContactInfo>> {
    try {
      return ok(await this.infoRepo.save(content));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async updateContactInfo(
    id: string,
    input: UpdateContactInfoInput
  ): Promise<Result<ContactInfo | null>> {
    try {
      return ok(await this.infoRepo.update(id, input));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async submitMessage(input: CreateContactMessageInput): Promise<Result<ContactMessage>> {
    try {
      const message = await this.messageRepo.create(input);
      return ok(message);
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async getMessages(params?: PaginationParams): Promise<Result<Paginated<ContactMessage>>> {
    try {
      return ok(await this.messageRepo.findAll(params));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async getUnreadCount(): Promise<Result<number>> {
    try {
      return ok(await this.messageRepo.countUnread());
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async markAsRead(id: string): Promise<Result<boolean>> {
    try {
      return ok(await this.messageRepo.markAsRead(id));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }

  async deleteMessage(id: string): Promise<Result<boolean>> {
    try {
      return ok(await this.messageRepo.delete(id));
    } catch (e) {
      return err(e instanceof Error ? e : new Error(String(e)));
    }
  }
}
