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

export function useVerifyEmailMutation() {
  return useMutation({
    mutationFn: (token: string) =>
      apiFetch<{ status: "verified" | "already_verified" }>("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
  });
}

/** Signed-in "Resend verification email". The API rate-limits and applies a cooldown. */
export function useResendMyVerificationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch<{ status: "sent" | "cooldown" | "already_verified" }>(
        "/auth/resend-verification/me",
        { method: "POST" },
      ),
    onSuccess: (r) => {
      if (r.status === "already_verified")
        void qc.invalidateQueries({ queryKey: ["account", "profile"] });
    },
  });
}

/** Public resend by address: the answer is the same whether or not the account exists. */
export function useResendVerificationMutation() {
  return useMutation({
    mutationFn: (email: string) =>
      apiFetch<{ message: string }>("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
  });
}
