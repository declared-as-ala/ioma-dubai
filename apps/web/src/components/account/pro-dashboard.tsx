"use client";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@ioma/config";
import { useB2BOrders } from "@/hooks/use-professional";
import { useMyTrainingBookings } from "@/hooks/use-trainings";
import { useProtocols } from "@/hooks/use-protocols";
import { formatMinor } from "@/lib/money";
import { AccountHeading, AccountLink, AccountSection, QueryState } from "./experience-ui";
import { QuickReorder } from "./quick-reorder";
import { PartnerStatus } from "./partner-status";
export function ProfessionalOrders({ preview = false }: { preview?: boolean }) {
  const t = useTranslations("AccountExperience");
  const a = useTranslations("Account.orders");
  const locale = useLocale() as Locale;
  const q = useB2BOrders();
  return (
    <AccountSection
      title={t("proRecent")}
      href={preview ? "/portal/orders" : undefined}
      action={t("allOrders")}
    >
      <QueryState query={q}>
        {q.data?.length ? (
          <ul className="divide-y divide-border">
            {(preview ? q.data.slice(0, 3) : q.data).map((o) => (
              <li
                key={o._id}
                className="flex flex-wrap items-center justify-between gap-5 py-6"
              >
                <div>
                  <p className="text-xs text-muted-foreground">{t("proOrder")}</p>
                  <p className="mt-2">
                    <bdi>{o.orderNumber}</bdi>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                      new Date(o.createdAt),
                    )}{" "}
                    · {a(`status.${o.fulfillmentStatus}`)}
                  </p>
                </div>
                <div className="text-end">
                  <p>{formatMinor(o.totalMinor, locale)}</p>
                  <AccountLink href={`/portal/orders/${o.orderNumber}`}>
                    {t("view")}
                  </AccountLink>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">{t("emptyPro")}</p>
            <AccountLink href="/portal/catalog">{t("catalog")}</AccountLink>
          </>
        )}
      </QueryState>
    </AccountSection>
  );
}
export default function ProfessionalDashboard() {
  const t = useTranslations("AccountExperience");
  const locale = useLocale() as Locale;
  const bookings = useMyTrainingBookings();
  const protocols = useProtocols();
  return (
    <>
      <AccountHeading title={t("professional")} description={t("proIntro")} />
      <PartnerStatus portal />
      <div className="my-8 flex flex-wrap gap-x-8 gap-y-3">
        {[
          ["catalog", "catalog"],
          ["cart", "proCart"],
          ["company", "company"],
          ["documents", "documents"],
          ["support", "support"],
        ].map(([href, key]) => (
          <AccountLink key={href} href={`/portal/${href}`}>
            {t(key!)}
          </AccountLink>
        ))}
      </div>
      <ProfessionalOrders preview />
      <QuickReorder />
      <AccountSection
        title={t("upcomingTraining")}
        href="/portal/trainings"
        action={t("training")}
      >
        <QueryState query={bookings}>
          {bookings.data?.filter(
            (b) => b.status === "booked" && new Date(b.startsAt) > new Date(),
          ).length ? (
            bookings.data
              .filter((b) => b.status === "booked" && new Date(b.startsAt) > new Date())
              .slice(0, 3)
              .map((b) => (
                <p className="py-3 text-sm" key={b.id}>
                  {new Intl.DateTimeFormat(locale, {
                    dateStyle: "long",
                    timeStyle: "short",
                    timeZone: "Asia/Dubai",
                  }).format(new Date(b.startsAt))}{" "}
                  · {b.location}
                </p>
              ))
          ) : (
            <p className="text-sm text-muted-foreground">{t("noTraining")}</p>
          )}
        </QueryState>
      </AccountSection>
      <AccountSection title={t("protocols")} href="/portal/protocols" action={t("view")}>
        <QueryState query={protocols}>
          {protocols.data?.slice(0, 3).map((p) => (
            <div key={p._id} className="border-b border-border py-4">
              <p className="text-lg">{p.title[locale]}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {p.description[locale]}
              </p>
            </div>
          ))}
        </QueryState>
      </AccountSection>
    </>
  );
}
