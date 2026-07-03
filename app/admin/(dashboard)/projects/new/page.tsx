import type { Metadata } from "next";
import { NewProjectForm } from "@/features/admin/NewProjectForm";
import { getAdminBasePath } from "@/lib/adminRoute";

export const metadata: Metadata = { title: "New Project" };

export default function AdminNewProjectPage() {
  return <NewProjectForm basePath={getAdminBasePath()} />;
}
