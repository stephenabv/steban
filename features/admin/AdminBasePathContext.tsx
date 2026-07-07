"use client";

import { createContext, useContext } from "react";

const AdminBasePathContext = createContext<string>("/admin");

export function AdminBasePathProvider({
  basePath,
  children,
}: {
  basePath: string;
  children: React.ReactNode;
}) {
  return <AdminBasePathContext.Provider value={basePath}>{children}</AdminBasePathContext.Provider>;
}

export function useAdminBasePath(): string {
  return useContext(AdminBasePathContext);
}
