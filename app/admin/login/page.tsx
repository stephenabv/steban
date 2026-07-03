import type { Metadata } from "next";
import { AdminLoginForm } from "@/features/admin/AdminLoginForm";
import { getAdminBasePath } from "@/lib/adminRoute";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return <AdminLoginForm basePath={getAdminBasePath()} />;
}
