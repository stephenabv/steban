import { getSession } from "./session";
import type { AuditService } from "@/server/services/AuditService";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

export class AuthService {
  constructor(private readonly auditService: AuditService) {}

  async login(
    username: string,
    password: string,
    ip?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD_HASH) {
      return { success: false, error: "Server configuration error." };
    }

    const { comparePassword } = await import("@/server/security/crypto");

    if (username !== ADMIN_USERNAME) {
      await this.auditService.log("login", "admin", { ip, metadata: { success: false } });
      return { success: false, error: "Invalid credentials." };
    }

    const valid = await comparePassword(password, ADMIN_PASSWORD_HASH);
    if (!valid) {
      await this.auditService.log("login", "admin", { ip, metadata: { success: false } });
      return { success: false, error: "Invalid credentials." };
    }

    const session = await getSession();
    session.isAdmin = true;
    session.adminId = "admin";
    await session.save();

    await this.auditService.log("login", "admin", { ip, metadata: { success: true } });
    return { success: true };
  }

  async logout(ip?: string): Promise<void> {
    const session = await getSession();
    session.destroy();
    await this.auditService.log("logout", "admin", { ip });
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await getSession();
    return session.isAdmin === true;
  }
}
