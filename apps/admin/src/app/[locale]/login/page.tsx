"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useLoginMutation } from "@/hooks/use-auth";
import type { AdminAccess } from "@/hooks/use-admin";
import { Button, Card, Field, Input } from "@/components/admin/polaris";

// Admin sign-in. Separate from the storefront /login: it lives in the admin app,
// uses its own browser session (ioma_admin_auth) and only lets through accounts
// that actually hold an admin role (verified server-side via /admin/access).
export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const login = useLoginMutation();
  const clearSession = useAuthStore((s) => s.clearSession);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  // Keep the form inert until hydrated so a fast Enter can never submit natively
  // (which would put the password in the URL).
  useEffect(() => setReady(true), []);

  const rawRedirect = params.get("redirect");
  const redirect =
    rawRedirect && rawRedirect.startsWith("/admin") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : "/admin";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login.mutateAsync({ email: email.trim(), password });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.statusCode === 429
            ? "Too many attempts. Please wait a minute and try again."
            : err.statusCode === 401
              ? "Incorrect email or password."
              : "The server returned an error. Please try again."
          : "Could not reach the server. Check that the API is running.",
      );
      return;
    }
    setChecking(true);
    try {
      const access = await apiFetch<AdminAccess>("/admin/access");
      if (!access.canAccess) throw new Error("no-admin");
      router.replace(redirect);
    } catch {
      clearSession();
      setError("This account does not have administrator access.");
      setChecking(false);
    }
  }

  const busy = login.isPending || checking;
  return (
    <main
      className="grid min-h-screen place-items-center px-4 py-10"
      style={{ background: "var(--pl-bg)" }}
    >
      <div className="w-full max-w-[400px] space-y-5">
        <div className="text-center">
          <p className="text-lg font-semibold tracking-[0.32em]">IOMA</p>
          <p className="pl-help !mt-1">Administration</p>
        </div>
        <Card>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4" aria-hidden />
              <h1 className="pl-card-title !mb-0 text-[15px]">
                Sign in to the back office
              </h1>
            </div>
            {error && (
              <p
                role="alert"
                className="pl-badge pl-badge--critical !whitespace-normal !rounded-lg !p-2"
              >
                {error}
              </p>
            )}
            <Field label="Email" htmlFor="admin-email">
              <Input
                id="admin-email"
                type="email"
                name="email"
                autoComplete="username"
                autoFocus
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password" htmlFor="admin-password">
              <div className="relative">
                <Input
                  id="admin-password"
                  type={show ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="!pe-10"
                />
                <button
                  type="button"
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow((s) => !s)}
                  className="pl-icon-btn absolute end-0.5 top-0.5"
                >
                  {show ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </Field>
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={!ready || busy || !email || !password}
            >
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </Card>
        <p className="pl-help text-center">
          Authorized personnel only. Activity is logged.
        </p>
      </div>
    </main>
  );
}
