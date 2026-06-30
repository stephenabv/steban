export type AuditAction =
  | "login"
  | "logout"
  | "create"
  | "update"
  | "delete"
  | "view"
  | "export";

export interface AuditEntry {
  id: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  actorId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export class AuditService {
  async log(
    action: AuditAction,
    resource: string,
    options?: {
      resourceId?: string;
      actorId?: string;
      ip?: string;
      userAgent?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    const entry: Omit<AuditEntry, "id"> = {
      action,
      resource,
      ...options,
      createdAt: new Date(),
    };
    // TODO: persist to audit log store (Vercel Postgres)
    if (process.env.NODE_ENV !== "production") {
      console.warn("[AuditService]", entry);
    }
  }
}
