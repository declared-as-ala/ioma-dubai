import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth-store";

// Zustand's persisted auth state isn't available synchronously on first
// render (it hydrates from localStorage after mount) — starting from a
// server-safe `false` and only reading the persistence API inside
// useEffect avoids a real production-only SSR mismatch found during the
// Sprint 4.5 responsive pass (see PROGRESS.md). Reused by every route that
// needs to know "is auth state settled yet," not just the account layout.
export function useAuthHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persistApi = useAuthStore.persist;
    if (!persistApi) {
      setHydrated(true);
      return;
    }

    const unsubscribe = persistApi.onFinishHydration(() => setHydrated(true));
    setHydrated(persistApi.hasHydrated());
    return unsubscribe;
  }, []);

  return hydrated;
}
