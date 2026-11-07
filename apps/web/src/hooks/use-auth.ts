import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AuthResult } from "@ioma/types";
import type { LoginInput, RegisterInput } from "@ioma/validation";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

export function useLoginMutation() {
  const qc = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiFetch<AuthResult>("/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (session) => {
      qc.clear();
      setSession(session);
    },
  });
}

export function useRegisterMutation() {
  const qc = useQueryClient();
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (input: RegisterInput) =>
      apiFetch<AuthResult>("/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (session) => {
      qc.clear();
      setSession(session);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const clearSession = useAuthStore((s) => s.clearSession);
  return useMutation({
    mutationFn: async () => {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        await apiFetch("/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refreshToken }),
        }).catch(() => undefined);
      }
    },
    onSettled: () => {
      qc.clear();
      clearSession();
    },
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (input: { email: string }) =>
      apiFetch<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (input: { token: string; password: string }) =>
      apiFetch<{ message: string }>("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}
