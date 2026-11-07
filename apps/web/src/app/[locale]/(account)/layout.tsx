"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { AccountNav } from "@/components/account/account-nav";
import { useAuthStore } from "@/stores/auth-store";
import { useAuthHydrated } from "@/hooks/use-auth-hydrated";
import { PageLoader } from "@/components/ui/loading-screen";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Account");
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthHydrated();

  useEffect(() => {
    if (hydrated && !user) router.replace("/login");
  }, [hydrated, router, user]);

  if (!hydrated || !user) {
    return (
      <main
        className="mx-auto min-h-[60vh] max-w-[1440px] px-4 md:px-6 py-12 flex items-center justify-center"
        aria-busy="true"
      >
        <PageLoader variant="luxury" label={t("loading")} fullScreen={false} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1440px] px-4 md:px-6 py-10 md:py-16">
      <div className="account-experience grid gap-8 lg:gap-12 lg:grid-cols-[260px_minmax(0,1fr)]">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </main>
  );
}
