"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { tr } from "@/lib/l10n";
import { EmptyNote, Eyebrow, PageTitle, ProCard, primaryBtn, useTx } from "./pro-ui";

interface Business {
  companyName: string;
  hasPublicProfile: boolean;
  partner: {
    slug: string;
    visible: boolean;
    name: string;
    description: { en?: string; fr?: string; ar?: string };
    openingHours: string;
    phone: string;
    whatsapp: string;
    email: string;
    website: string;
    address: string;
    city: string;
    emirate: string;
  } | null;
  pendingChange: { fields: Record<string, unknown>; requestedAt: string } | null;
}

const KEY = ["pro", "business"] as const;
const input =
  "mt-1 w-full rounded-xl border border-[#e8e1d4] bg-white px-4 py-3 text-sm outline-none focus-visible:border-[#bfa273] focus-visible:ring-2 focus-visible:ring-[#bfa273]/30";

/** The partner's own public profile. Light edits go live at once; identity and location are reviewed by IOMA. */
export function ProBusiness() {
  const { loc } = useTx();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch<Business>("/professional/me/business"),
  });
  const [v, setV] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<{
    applied: string[];
    pendingReview: string[];
  } | null>(null);
  const p = q.data?.partner;

  useEffect(() => {
    if (!p) return;
    setV({
      descEn: p.description?.en ?? "",
      descFr: p.description?.fr ?? "",
      descAr: p.description?.ar ?? "",
      openingHours: p.openingHours ?? "",
      phone: p.phone ?? "",
      whatsapp: p.whatsapp ?? "",
      email: p.email ?? "",
      website: p.website ?? "",
      name: p.name ?? "",
      address: p.address ?? "",
      city: p.city ?? "",
    });
  }, [p]);

  const save = useMutation({
    mutationFn: () =>
      apiFetch<{ applied: string[]; pendingReview: string[] }>(
        "/professional/me/business",
        {
          method: "PATCH",
          body: JSON.stringify({
            description: {
              en: v.descEn ?? "",
              fr: v.descFr || undefined,
              ar: v.descAr ?? "",
            },
            openingHours: v.openingHours || null,
            phone: v.phone,
            whatsapp: v.whatsapp || null,
            email: v.email || null,
            website: v.website || null,
            name: v.name,
            address: v.address,
            city: v.city,
          }),
        },
      ),
    onSuccess: (r) => {
      setSaved(r);
      void qc.invalidateQueries({ queryKey: KEY });
    },
  });
  const set =
    (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setV((s) => ({ ...s, [k]: e.target.value }));

  const field = (k: string, label: string, props: Record<string, unknown> = {}) => (
    <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
      {label}
      <input className={input} value={v[k] ?? ""} onChange={set(k)} {...props} />
    </label>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <PageTitle
        title={tr(loc, {
          en: "Business profile",
          fr: "Profil de l'établissement",
          ar: "ملف المؤسسة",
        })}
      >
        {tr(loc, {
          en: "How your institute appears on the IOMA Paris website. Contact and description updates go live at once; name and address changes are reviewed by IOMA first.",
          fr: "La présentation de votre établissement sur le site IOMA Paris. Les contacts et la description sont publiés immédiatement ; le nom et l'adresse sont validés par IOMA.",
          ar: "كيف تظهر مؤسستكم على موقع IOMA Paris. تُنشر تعديلات التواصل والوصف فوراً، ويراجع فريق IOMA الاسم والعنوان أولاً.",
        })}
      </PageTitle>

      {q.isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-[#e8e1d4]/50" />
      ) : q.isError ? (
        <EmptyNote>
          {tr(loc, {
            en: "Your business profile could not be loaded.",
            fr: "Impossible de charger le profil.",
            ar: "تعذّر تحميل الملف.",
          })}
        </EmptyNote>
      ) : !p ? (
        <EmptyNote>
          {tr(loc, {
            en: "Your public profile is not set up yet. The IOMA team will create it with you; contact us from the Support page.",
            fr: "Votre profil public n'est pas encore créé. L'équipe IOMA le configurera avec vous ; contactez-nous via la page Support.",
            ar: "لم يتم إعداد ملفكم العام بعد. سيُنشئه فريق IOMA معكم؛ تواصلوا معنا من صفحة الدعم.",
          })}
        </EmptyNote>
      ) : (
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <ProCard className="space-y-1 p-5 text-sm">
            <Eyebrow>
              {p.visible
                ? tr(loc, {
                    en: "Visible on the website",
                    fr: "Visible sur le site",
                    ar: "ظاهر على الموقع",
                  })
                : tr(loc, {
                    en: "Not visible on the website",
                    fr: "Non visible sur le site",
                    ar: "غير ظاهر على الموقع",
                  })}
            </Eyebrow>
            <p className="text-muted-foreground">
              {tr(loc, {
                en: "Visibility is managed by IOMA.",
                fr: "La visibilité est gérée par IOMA.",
                ar: "يتم التحكم بالظهور من قبل IOMA.",
              })}
            </p>
          </ProCard>

          {q.data?.pendingChange && (
            <p
              role="status"
              className="rounded-2xl border border-[#bfa273]/40 bg-[#bfa273]/10 p-4 text-sm"
            >
              {tr(loc, {
                en: "A change to your name or address is waiting for IOMA's review. Your public profile keeps the current details until then.",
                fr: "Une modification de votre nom ou adresse est en attente de validation. Le profil public garde les informations actuelles d'ici là.",
                ar: "يوجد تعديل على الاسم أو العنوان بانتظار مراجعة IOMA. يبقى الملف العام بالبيانات الحالية حتى ذلك الحين.",
              })}
            </p>
          )}

          <ProCard className="space-y-5 p-6">
            <h2 className="font-display text-xl">
              {tr(loc, {
                en: "Contact & description",
                fr: "Contact et description",
                ar: "التواصل والوصف",
              })}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("phone", tr(loc, { en: "Phone", fr: "Téléphone", ar: "الهاتف" }), {
                type: "tel",
                dir: "ltr",
                required: true,
              })}
              {field("whatsapp", "WhatsApp", { type: "tel", dir: "ltr" })}
              {field(
                "email",
                tr(loc, { en: "Business email", fr: "E-mail", ar: "البريد" }),
                { type: "email", dir: "ltr" },
              )}
              {field(
                "website",
                tr(loc, { en: "Website", fr: "Site web", ar: "الموقع" }),
                { dir: "ltr" },
              )}
            </div>
            {field(
              "openingHours",
              tr(loc, { en: "Opening hours", fr: "Horaires", ar: "ساعات العمل" }),
            )}
            {(
              [
                ["descEn", "English"],
                ["descFr", "Français"],
                ["descAr", "العربية"],
              ] as const
            ).map(([k, name]) => (
              <label
                key={k}
                className="block text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"
              >
                {tr(loc, { en: "Description", fr: "Description", ar: "الوصف" })} · {name}
                <textarea
                  rows={4}
                  dir={k === "descAr" ? "rtl" : "ltr"}
                  className={input}
                  value={v[k] ?? ""}
                  onChange={set(k)}
                />
              </label>
            ))}
          </ProCard>

          <ProCard className="space-y-5 p-6">
            <h2 className="font-display text-xl">
              {tr(loc, {
                en: "Name & address (reviewed by IOMA)",
                fr: "Nom et adresse (validés par IOMA)",
                ar: "الاسم والعنوان (تراجعهما IOMA)",
              })}
            </h2>
            {field(
              "name",
              tr(loc, {
                en: "Institute name",
                fr: "Nom de l'établissement",
                ar: "اسم المؤسسة",
              }),
            )}
            {field("address", tr(loc, { en: "Address", fr: "Adresse", ar: "العنوان" }))}
            {field("city", tr(loc, { en: "City", fr: "Ville", ar: "المدينة" }))}
          </ProCard>

          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" disabled={save.isPending} className={primaryBtn}>
              {tr(loc, { en: "Save changes", fr: "Enregistrer", ar: "حفظ التعديلات" })}
            </button>
            {saved && (
              <p
                role="status"
                className="inline-flex items-center gap-1.5 text-sm text-emerald-700"
              >
                <Check className="size-4" />
                {saved.pendingReview.length
                  ? tr(loc, {
                      en: "Saved. Name/address changes are awaiting IOMA's review.",
                      fr: "Enregistré. Les changements de nom/adresse sont en attente de validation.",
                      ar: "تم الحفظ. تعديلات الاسم/العنوان بانتظار المراجعة.",
                    })
                  : tr(loc, {
                      en: "Saved and live.",
                      fr: "Enregistré et publié.",
                      ar: "تم الحفظ والنشر.",
                    })}
              </p>
            )}
            {save.isError && (
              <p role="alert" className="text-sm text-destructive">
                {tr(loc, {
                  en: "Could not save. Please check the fields and try again.",
                  fr: "Enregistrement impossible. Vérifiez les champs.",
                  ar: "تعذّر الحفظ. تحقّقوا من الحقول.",
                })}
              </p>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
