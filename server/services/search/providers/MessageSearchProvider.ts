import type { SearchField } from "@/lib/search/SearchQuery";
import type { ContactMessage } from "@/server/domain/entities";
import type { ContactService } from "../../ContactService";
import { AdminSearchProvider, type ProviderHit } from "../AdminSearchProvider";

/** Matches the rows the admin inbox loads. */
const LOAD_LIMIT = 100;

export class MessageSearchProvider extends AdminSearchProvider<ContactMessage> {
  readonly group = "messages" as const;
  readonly label = "Messages";

  constructor(private readonly contact: ContactService) {
    super();
  }

  protected async load(): Promise<readonly ContactMessage[]> {
    return this.unwrap(await this.contact.getMessages({ page: 1, pageSize: LOAD_LIMIT })).items;
  }

  protected fields(m: ContactMessage): SearchField[] {
    return [
      { text: m.name, weight: 3 },
      { text: m.subject, weight: 3 },
      { text: m.email, weight: 2 },
      { text: m.message, weight: 1 },
    ];
  }

  // Only what the palette shows leaves the server: never the message body or sender IP.
  protected toHit(m: ContactMessage): ProviderHit {
    return {
      id: m.id,
      title: m.subject || m.name,
      subtitle: `${m.name} · ${m.email}`,
      badge: m.read ? undefined : "Unread",
      path: `/messages?open=${encodeURIComponent(m.id)}`,
    };
  }

  protected recency(m: ContactMessage): number {
    return m.createdAt.getTime();
  }
}
