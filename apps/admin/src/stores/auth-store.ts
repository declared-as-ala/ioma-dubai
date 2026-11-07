import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@ioma/types";

// Session tokens, not server data fetched via TanStack Query — genuinely
// client-only state per CLAUDE.md. Persisted to localStorage so a page
// refresh doesn't log the user out; the API itself returns both tokens in
// the response body (no httpOnly cookie — see DECISIONS.md), so storing
// them the same way on the client is the consistent choice, not a
// weaker one introduced independently by the frontend.
interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (session: {
    user: AuthUser;
    accessToken: string;
    refreshToken: string;
  }) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      setSession: (session) =>
        set({
          user: session.user,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
        }),
      clearSession: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: "ioma_admin_auth" },
  ),
);
