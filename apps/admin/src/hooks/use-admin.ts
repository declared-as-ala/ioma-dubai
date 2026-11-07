"use client";
import { useQuery } from "@tanstack/react-query";
import type { AdminPermission, AdminResource } from "@ioma/config";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { apiFetch } from "@/lib/api";

export interface AdminAccess {
  canAccess: boolean;
  user: { id: string; email: string; roles: string[] };
  permissions: AdminPermission[];
  resources: AdminResource[];
}
export function useAdminAccess() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthHydrated();
  return useQuery({
    queryKey: ["admin", "access", user?.id],
    queryFn: () => apiFetch<AdminAccess>("/admin/access"),
    enabled: hydrated,
    staleTime: 15000,
    refetchInterval: 60000,
    retry: false,
  });
}
export function useAdminQuery<T>(path: string, enabled = true) {
  return useQuery({
    queryKey: ["admin", path],
    queryFn: () => apiFetch<T>(`/admin/${path}`),
    enabled,
    retry: false,
    placeholderData: (previous, query) =>
      path.startsWith("resources/") &&
      path.includes("?") &&
      String(query?.queryKey[1]).split("?")[0] === path.split("?")[0]
        ? previous
        : undefined,
  });
}
export interface AdminList {
  items: Record<string, any>[];
  total: number;
  page: number;
  limit: number;
}
