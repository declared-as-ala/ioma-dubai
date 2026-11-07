"use client";

import { useTranslations } from "next-intl";
import {
  Sparkles,
  ShoppingBag,
  Calendar,
  Heart,
  ArrowRight,
  ShieldCheck,
  Award,
  ChevronRight,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useProfileQuery } from "@/hooks/use-account";
import { useApplications } from "@/hooks/use-professional";
import { useOrdersQuery } from "@/hooks/use-orders";
import { useWishlistQuery } from "@/hooks/use-wishlist";
import { AccountHeading, QueryState } from "./experience-ui";
import { PartnerStatus } from "./partner-status";
import { RecentOrders, WishlistPreview } from "./activity-overview";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

export default function AccountDashboard() {
  const t = useTranslations("AccountExperience");
  const a = useTranslations("Account");
  const profile = useProfileQuery();
  const apps = useApplications();
  const orders = useOrdersQuery();
  const wishlist = useWishlistQuery();
  const firstName = profile.data?.firstName || "";
  const ordersCount = orders.data?.length ?? 0;
  const wishlistCount = wishlist.data?.length ?? 0;

  return (
    <div className="space-y-10">
      <QueryState query={profile}>
        <AccountHeading
          title={a("dashboard.welcomeBack", { firstName: firstName || "Client IOMA" })}
          description={t("intro")}
          badge="ESPACE PRIVILÈGE"
        >
          {/* Member Status Badge */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-border/80 bg-muted/30 px-3.5 py-1.5 text-xs text-foreground/80 shadow-xs">
            <Award className="size-3.5 text-sf-champagne" />
            <span className="font-medium tracking-wide">Club Privilège</span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-muted-foreground text-[11px]">Membre Actif</span>
          </div>
        </AccountHeading>
      </QueryState>

      {/* Quick Access KPI Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Orders Card */}
        <Link
          href="/account/orders"
          className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-4 transition-all duration-200 hover:border-foreground/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="flex size-9 items-center justify-center rounded-xl bg-muted/60 text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
              <ShoppingBag className="size-4" />
            </span>
            <span className="text-xs font-semibold text-foreground/80">
              {ordersCount}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {a("nav.orders")}
            </p>
            <p className="mt-0.5 text-sm font-medium text-foreground group-hover:underline">
              {ordersCount > 0
                ? `${ordersCount} passée${ordersCount > 1 ? "s" : ""}`
                : "Suivre mes achats"}
            </p>
          </div>
        </Link>

        {/* Addresses Card */}
        <Link
          href="/account/addresses"
          className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-4 transition-all duration-200 hover:border-foreground/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="flex size-9 items-center justify-center rounded-xl bg-muted/60 text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
              <ShieldCheck className="size-4" />
            </span>
            <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-foreground">
              UAE
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {a("nav.addresses")}
            </p>
            <p className="mt-0.5 text-sm font-medium text-foreground group-hover:underline">
              Gérer mes adresses
            </p>
          </div>
        </Link>

        {/* Partner Locator Card */}
        <Link
          href="/partners"
          className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-4 transition-all duration-200 hover:border-foreground/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="flex size-9 items-center justify-center rounded-xl bg-muted/60 text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
              <MapPin className="size-4" />
            </span>
            <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-foreground">
              Spas
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Partenaires
            </p>
            <p className="mt-0.5 text-sm font-medium text-foreground group-hover:underline">
              Trouver un institut
            </p>
          </div>
        </Link>

        {/* Wishlist Card */}
        <Link
          href="/account/wishlist"
          className="group relative flex flex-col justify-between rounded-2xl border border-border/70 bg-card p-4 transition-all duration-200 hover:border-foreground/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="flex size-9 items-center justify-center rounded-xl bg-muted/60 text-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
              <Heart className="size-4" />
            </span>
            <span className="text-xs font-semibold text-foreground/80">
              {wishlistCount}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {a("nav.wishlist")}
            </p>
            <p className="mt-0.5 text-sm font-medium text-foreground group-hover:underline">
              {wishlistCount > 0
                ? `${wishlistCount} produit${wishlistCount > 1 ? "s" : ""}`
                : "Mes favoris"}
            </p>
          </div>
        </Link>
      </div>

      {/* Bespoke Care In.Lab Featurette Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-foreground via-neutral-900 to-neutral-800 text-background p-6 sm:p-8 lg:p-10 shadow-md">
        <div className="absolute -end-12 -top-12 size-64 rounded-full bg-sf-champagne/20 blur-3xl" />
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-background/20 bg-background/10 px-3 py-1 text-[11px] font-medium tracking-widest text-background uppercase backdrop-blur-xs">
            <Sparkles className="size-3 text-sf-champagne" />
            Haute Cosmétique · In.Lab
          </div>
          <h2 className="mt-4 font-display text-2xl sm:text-3xl font-light tracking-tight text-white">
            Votre Formule Sur-Mesure IOMA Paris
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-300">
            Découvrez la haute cosmétique personnalisée formulée goutte à goutte selon les
            besoins exclusifs de votre peau. Disponible en institut partenaire ou sur
            commande personnalisée.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-white text-black hover:bg-neutral-200 tracking-wider text-xs uppercase px-6"
            >
              <Link href="/shop/ma-creme-jour" className="flex items-center gap-2">
                <span>Créer ma formule</span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full bg-transparent border-white/40 text-white hover:bg-white/15 hover:text-white tracking-wider text-xs uppercase"
            >
              <Link href="/partners">Trouver un institut partenaire</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Professional Status or Invite Banner */}
      {apps.data?.length ? (
        <PartnerStatus />
      ) : (
        <section className="rounded-2xl border border-border/70 bg-gradient-to-r from-muted/30 via-background to-muted/20 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <ShieldCheck className="size-4 text-sf-champagne" />
                <span>Espace Professionnel & Spas</span>
              </div>
              <h3 className="mt-2 font-display text-xl sm:text-2xl font-light text-foreground">
                Devenez Partenaire Agréé IOMA Paris
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Vous dirigez un spa de luxe, une clinique esthétique ou un institut aux
                Émirats ? Accédez aux tarifs wholesale, aux cabines exclusives et aux
                formations protocolaires.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="shrink-0 rounded-full uppercase tracking-wider text-xs"
            >
              <Link href="/professionals/apply" className="flex items-center gap-2">
                <span>Demander un accès</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Recent Orders Section */}
      <RecentOrders />

      {/* Wishlist Preview */}
      <WishlistPreview />
    </div>
  );
}
