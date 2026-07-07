import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type {
  ContactInfo,
  ContactMessage,
  CreateContactMessageInput,
  UpdateContactInfoInput,
} from "@/server/domain/entities";
import type { Paginated, PaginationParams } from "@/server/domain/types";
import { ContactInfoRepository, ContactMessageRepository } from "./ContactRepository";

/**
 * File-backed repositories for local development (no DATABASE_URL/POSTGRES_URL).
 * Not suitable for serverless production — the filesystem there is ephemeral.
 */

const MESSAGES_FILE = path.join(process.cwd(), "data", "contact-messages.json");
const INFO_FILE = path.join(process.cwd(), "data", "contact-info.json");

async function readJson<T>(file: string): Promise<T[]> {
  try {
    return JSON.parse(await fs.readFile(file, "utf-8")) as T[];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

async function writeJson<T>(file: string, data: T[]): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
}

/* -------------------------------------------------------------------------- */
/*  Contact messages                                                          */
/* -------------------------------------------------------------------------- */

type StoredMessage = Omit<ContactMessage, "createdAt"> & { createdAt: string };

const reviveMessage = (s: StoredMessage): ContactMessage => ({
  ...s,
  createdAt: new Date(s.createdAt),
});

export class JsonContactMessageRepository extends ContactMessageRepository {
  private read(): Promise<StoredMessage[]> {
    return readJson<StoredMessage>(MESSAGES_FILE);
  }

  async findById(id: string): Promise<ContactMessage | null> {
    const all = await this.read();
    const found = all.find((m) => m.id === id);
    return found ? reviveMessage(found) : null;
  }

  async findAll(params?: PaginationParams): Promise<Paginated<ContactMessage>> {
    const all = (await this.read())
      .map(reviveMessage)
      .sort(
        (a, b) => Number(a.read) - Number(b.read) || b.createdAt.getTime() - a.createdAt.getTime()
      );
    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 20;
    const items = all.slice((page - 1) * pageSize, page * pageSize);
    return this.paginate(items, all.length, params);
  }

  async create(input: CreateContactMessageInput): Promise<ContactMessage> {
    const all = await this.read();
    const message: ContactMessage = {
      ...input,
      id: randomUUID(),
      read: false,
      createdAt: new Date(),
    };
    all.push({ ...message, createdAt: message.createdAt.toISOString() });
    await writeJson(MESSAGES_FILE, all);
    return message;
  }

  async update(id: string, input: { read: boolean }): Promise<ContactMessage | null> {
    const all = await this.read();
    const index = all.findIndex((m) => m.id === id);
    if (index === -1) return null;
    all[index] = { ...all[index], read: input.read };
    await writeJson(MESSAGES_FILE, all);
    return reviveMessage(all[index]);
  }

  async markAsRead(id: string): Promise<boolean> {
    return (await this.update(id, { read: true })) !== null;
  }

  async delete(id: string): Promise<boolean> {
    const all = await this.read();
    const remaining = all.filter((m) => m.id !== id);
    if (remaining.length === all.length) return false;
    await writeJson(MESSAGES_FILE, remaining);
    return true;
  }
}

/* -------------------------------------------------------------------------- */
/*  Contact info (single-row settings)                                        */
/* -------------------------------------------------------------------------- */

type StoredInfo = Omit<ContactInfo, "updatedAt"> & { updatedAt: string };

const reviveInfo = (s: StoredInfo): ContactInfo => ({
  ...s,
  updatedAt: new Date(s.updatedAt),
});

export class JsonContactInfoRepository extends ContactInfoRepository {
  private read(): Promise<StoredInfo[]> {
    return readJson<StoredInfo>(INFO_FILE);
  }

  async getContactInfo(): Promise<ContactInfo | null> {
    const all = await this.read();
    return all[0] ? reviveInfo(all[0]) : null;
  }

  async findById(id: string): Promise<ContactInfo | null> {
    const all = await this.read();
    const found = all.find((i) => i.id === id);
    return found ? reviveInfo(found) : null;
  }

  async update(id: string, input: UpdateContactInfoInput): Promise<ContactInfo | null> {
    const all = await this.read();
    const index = all.findIndex((i) => i.id === id);
    if (index === -1) return null;
    const updated: StoredInfo = {
      ...all[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };
    all[index] = updated;
    await writeJson(INFO_FILE, all);
    return reviveInfo(updated);
  }

  async delete(id: string): Promise<boolean> {
    const all = await this.read();
    const remaining = all.filter((i) => i.id !== id);
    if (remaining.length === all.length) return false;
    await writeJson(INFO_FILE, remaining);
    return true;
  }
}
