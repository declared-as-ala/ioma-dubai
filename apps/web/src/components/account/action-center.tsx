"use client";

import { useTranslations } from "next-intl";
import { PartnerStatus } from "./partner-status";
import { NextAppointment } from "./activity-overview";
import { AccountHeading } from "./experience-ui";
import { useApplications } from "@/hooks/use-professional";
import { Bell, Sparkles, CheckCircle2 } from "lucide-react";

export default function ActionCenter() {
  const t = useTranslations("AccountExperience");
  const apps = useApplications();

  return (
    <div className="space-y-8">
      <AccountHeading
        title={t("notifications")}
        description="Consultez les mises à jour relatives à vos commandes, vos soins sur-mesure et vos demandes de partenariat professionnel."
        badge="CENTRE DE NOTIFICATIONS"
      />

      {/* Notifications List Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-border/60 pb-4">
          <Bell className="size-4 text-muted-foreground" />
          <h2 className="font-display text-base font-medium text-foreground">
            Alertes & Mises à Jour Récentes
          </h2>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3.5 rounded-xl bg-muted/30 p-4 border border-border/50">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="size-4" />
            </span>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-foreground">
                Bienvenue dans votre Club Privilège IOMA Paris
              </p>
              <p className="text-xs text-muted-foreground">
                Votre profil UAE est actif. Vous bénéficiez désormais de la livraison
                express offerte dès 300 AED à Dubai et aux Émirats.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-xl bg-muted/30 p-4 border border-border/50">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sf-champagne/15 text-foreground">
              <Sparkles className="size-4 text-sf-champagne" />
            </span>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-foreground">
                Soins Sur-Mesure In.Lab Disponibles
              </p>
              <p className="text-xs text-muted-foreground">
                Découvrez la cosmétique sur-mesure formulée à la goutte pour votre peau
                auprès de nos instituts partenaires à Dubai.
              </p>
            </div>
          </div>
        </div>
      </div>

      {apps.data?.length ? <PartnerStatus /> : null}

      <NextAppointment />
    </div>
  );
}
