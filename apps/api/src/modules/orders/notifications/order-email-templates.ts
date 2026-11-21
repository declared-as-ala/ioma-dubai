import { escapeHtml as esc } from "../../../common/mail/mail.util";
import {
  layout,
  toEmailLocale,
  type EmailLocale,
} from "../../../common/mail/email-templates";

export type OrderEmailKind =
  | "placed"
  | "payment_received"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "cancelled_refunded";

export interface LocalizedName {
  en?: string;
  fr?: string;
  ar?: string;
}

export interface OrderEmailAddress {
  fullName: string;
  phone?: string;
  emirate?: string;
  city?: string;
  addressLine1?: string;
  addressLine2?: string | null;
}

export interface OrderEmailData {
  orderNumber: string;
  createdAt: Date;
  type: "b2c" | "b2b";
  locale: EmailLocale;
  customerName: string;
  companyName?: string | null;
  customerEmail: string;
  customerPhone?: string | null;
  items: Array<{
    name: LocalizedName;
    sku: string;
    qty: number;
    unitMinor: number;
    totalMinor: number;
    imageUrl?: string | null;
  }>;
  subtotalMinor: number;
  taxMinor: number;
  shippingMinor: number;
  totalMinor: number;
  currency: string;
  shippingAddress: OrderEmailAddress;
  billingAddress?: OrderEmailAddress | null;
  paymentMethod?: string | null;
  paymentStatus: string;
  fulfillmentStatus: string;
  shippingProvider?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  /** Link the customer opens to see the order (account, portal or guest confirmation page). */
  orderUrl: string;
  /** Link to the order in the admin dashboard. */
  adminUrl: string;
  supportEmail: string;
}

export interface BuiltEmail {
  subject: string;
  html: string;
}

type L3 = { en: string; fr: string; ar: string };
const t = (l: EmailLocale, v: L3) => v[l];
const p = (html: string) => `<p style="margin:0 0 16px;">${html}</p>`;

/** "AED 217.00": always left-to-right so the number never reorders inside Arabic text. */
export function money(minor: number, currency = "AED"): string {
  return `<span dir="ltr" style="white-space:nowrap;">${esc(currency)}&nbsp;${(minor / 100).toFixed(2)}</span>`;
}
export function moneyText(minor: number, currency = "AED"): string {
  return `${currency} ${(minor / 100).toFixed(2)}`;
}

function formatDate(d: Date, l: EmailLocale): string {
  const tag = l === "ar" ? "ar-AE-u-nu-latn" : l === "fr" ? "fr-FR" : "en-GB";
  return new Intl.DateTimeFormat(tag, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Dubai",
  }).format(d);
}

/** Product name in the reader's language. Never falls back into French for English/Arabic readers. */
export function pickName(n: LocalizedName, l: EmailLocale): string {
  const v = (n[l] ?? "").trim();
  if (v) return v;
  return (
    (n.en ?? "").trim() || (l === "fr" ? (n.fr ?? "").trim() : "") || (n.fr ?? "").trim()
  );
}

const PAYMENT_METHOD: Record<string, L3> = {
  demo: {
    en: "Demo payment (test mode, no card charged)",
    fr: "Paiement de démonstration (mode test, aucune carte débitée)",
    ar: "دفع تجريبي (وضع الاختبار، لا يتم خصم أي مبلغ من بطاقتكم)",
  },
  cash_on_delivery: {
    en: "Cash on delivery",
    fr: "Paiement à la livraison",
    ar: "الدفع عند الاستلام",
  },
  other: { en: "Online payment", fr: "Paiement en ligne", ar: "دفع إلكتروني" },
};
const PAYMENT_STATUS: Record<string, L3> = {
  pending: { en: "Awaiting payment", fr: "En attente de paiement", ar: "بانتظار الدفع" },
  authorized: { en: "Authorised", fr: "Autorisé", ar: "تمت الموافقة على الدفع" },
  paid: { en: "Paid", fr: "Payé", ar: "مدفوع" },
  failed: { en: "Payment failed", fr: "Paiement échoué", ar: "فشلت عملية الدفع" },
  refunded: { en: "Refunded", fr: "Remboursé", ar: "تم الاسترداد" },
};
const ORDER_STATUS: Record<string, L3> = {
  pending: { en: "Received", fr: "Reçue", ar: "تم الاستلام" },
  processing: {
    en: "Confirmed, being prepared",
    fr: "Confirmée, en préparation",
    ar: "مؤكَّد، قيد التجهيز",
  },
  shipped: { en: "Shipped", fr: "Expédiée", ar: "تم الشحن" },
  delivered: { en: "Delivered", fr: "Livrée", ar: "تم التسليم" },
  cancelled: { en: "Cancelled", fr: "Annulée", ar: "ملغى" },
};

const paymentMethodLabel = (m: string | null | undefined, l: EmailLocale) =>
  t(l, PAYMENT_METHOD[m ?? ""] ?? PAYMENT_METHOD.other!);
const paymentStatusLabel = (s: string, l: EmailLocale) =>
  t(l, PAYMENT_STATUS[s] ?? PAYMENT_STATUS.pending!);
const orderStatusLabel = (s: string, l: EmailLocale) =>
  t(l, ORDER_STATUS[s] ?? ORDER_STATUS.pending!);

function addressBlock(a: OrderEmailAddress): string {
  const lines = [
    a.fullName,
    a.addressLine1,
    a.addressLine2,
    [a.city, a.emirate].filter(Boolean).join(", "),
    a.phone ? `‎${a.phone}` : "",
  ].filter((x): x is string => !!x && x.trim() !== "");
  return lines.map((x) => esc(x)).join("<br>");
}

const FONT = "font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;";

function itemsTable(o: OrderEmailData, l: EmailLocale, withSku: boolean): string {
  const align = l === "ar" ? "right" : "left";
  const opp = l === "ar" ? "left" : "right";
  const head = (txt: string, a: string) =>
    `<td align="${a}" style="padding:0 0 8px;${FONT}font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#8a7f6d;">${esc(txt)}</td>`;
  const rows = o.items
    .map((i) => {
      const name = esc(pickName(i.name, l));
      const img = i.imageUrl
        ? `<td width="64" valign="top" style="padding:12px 12px 12px 0;"><img src="${esc(i.imageUrl)}" width="52" height="52" alt="" style="display:block;border:0;object-fit:cover;background:#f5f1ea;"></td>`
        : "";
      return `<tr style="border-top:1px solid #eee7da;">
${img}<td valign="top" align="${align}" style="padding:12px 8px;${FONT}font-size:14px;line-height:1.5;color:#222;"><strong style="font-weight:600;">${name}</strong>${
        withSku
          ? `<br><span dir="ltr" style="font-size:11px;color:#8a8478;">SKU ${esc(i.sku)}</span>`
          : ""
      }<br><span style="font-size:12px;color:#6b665c;">${i.qty} &times; ${money(i.unitMinor, o.currency)}</span></td>
<td valign="top" align="${opp}" style="padding:12px 0;${FONT}font-size:14px;color:#222;white-space:nowrap;">${money(i.totalMinor, o.currency)}</td></tr>`;
    })
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 4px;"><tr>${
    o.items.some((i) => i.imageUrl)
      ? head("", align).replace("<td", '<td width="64"')
      : ""
  }${head(t(l, { en: "Item", fr: "Article", ar: "المنتج" }), align)}${head(
    t(l, { en: "Total", fr: "Total", ar: "الإجمالي" }),
    opp,
  )}</tr>${rows}</table>`;
}

function totalsTable(o: OrderEmailData, l: EmailLocale): string {
  const align = l === "ar" ? "right" : "left";
  const opp = l === "ar" ? "left" : "right";
  const row = (label: string, value: string, strong = false) =>
    `<tr><td align="${align}" style="padding:5px 0;${FONT}font-size:${strong ? 15 : 13}px;color:${strong ? "#111" : "#5c574d"};${strong ? "font-weight:700;border-top:1px solid #111;padding-top:10px;" : ""}">${esc(label)}</td><td align="${opp}" style="padding:5px 0;${FONT}font-size:${strong ? 15 : 13}px;color:${strong ? "#111" : "#3b3b3b"};${strong ? "font-weight:700;border-top:1px solid #111;padding-top:10px;" : ""}white-space:nowrap;">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 22px;">
${row(t(l, { en: "Subtotal (excl. VAT)", fr: "Sous-total (HT)", ar: "المجموع الفرعي (بدون الضريبة)" }), money(o.subtotalMinor, o.currency))}
${row(t(l, { en: "VAT (5%)", fr: "TVA (5 %)", ar: "ضريبة القيمة المضافة (5٪)" }), money(o.taxMinor, o.currency))}
${row(t(l, { en: "Shipping", fr: "Livraison", ar: "الشحن" }), o.shippingMinor === 0 ? esc(t(l, { en: "Free", fr: "Offerte", ar: "مجاني" })) : money(o.shippingMinor, o.currency))}
${row(t(l, { en: "Total", fr: "Total", ar: "الإجمالي" }), money(o.totalMinor, o.currency), true)}
</table>`;
}

function infoBlock(label: string, valueHtml: string): string {
  return `<p style="margin:0 0 4px;${FONT}font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#8a7f6d;">${esc(label)}</p><p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#222;">${valueHtml}</p>`;
}

function summary(o: OrderEmailData, l: EmailLocale): string {
  const sameBilling =
    !o.billingAddress ||
    JSON.stringify(o.billingAddress) === JSON.stringify(o.shippingAddress);
  return (
    infoBlock(
      t(l, { en: "Order", fr: "Commande", ar: "الطلب" }),
      `<strong dir="ltr">${esc(o.orderNumber)}</strong> &middot; ${esc(formatDate(o.createdAt, l))}`,
    ) +
    itemsTable(o, l, false) +
    totalsTable(o, l) +
    infoBlock(
      t(l, { en: "Payment", fr: "Paiement", ar: "الدفع" }),
      `${esc(paymentMethodLabel(o.paymentMethod, l))}<br><strong>${esc(paymentStatusLabel(o.paymentStatus, l))}</strong>`,
    ) +
    infoBlock(
      t(l, { en: "Order status", fr: "Statut de la commande", ar: "حالة الطلب" }),
      `<strong>${esc(orderStatusLabel(o.fulfillmentStatus, l))}</strong>`,
    ) +
    infoBlock(
      t(l, { en: "Delivery address", fr: "Adresse de livraison", ar: "عنوان التسليم" }),
      addressBlock(o.shippingAddress),
    ) +
    (sameBilling
      ? ""
      : infoBlock(
          t(l, {
            en: "Billing address",
            fr: "Adresse de facturation",
            ar: "عنوان الفوترة",
          }),
          addressBlock(o.billingAddress!),
        ))
  );
}

function support(o: OrderEmailData, l: EmailLocale): string {
  const mail = esc(o.supportEmail);
  return `<p style="margin:22px 0 0;padding-top:18px;border-top:1px solid #eee7da;font-size:13px;line-height:1.7;color:#6b665c;">${t(
    l,
    {
      en: `Questions about your order? Write to us at <a href="mailto:${mail}" style="color:#8a7f6d;">${mail}</a> and quote your order number.`,
      fr: `Une question sur votre commande ? Écrivez-nous à <a href="mailto:${mail}" style="color:#8a7f6d;">${mail}</a> en indiquant votre numéro de commande.`,
      ar: `هل لديكم سؤال حول طلبكم؟ راسلونا على <a href="mailto:${mail}" style="color:#8a7f6d;">${mail}</a> مع ذكر رقم الطلب.`,
    },
  )}</p>`;
}

function greeting(o: OrderEmailData, l: EmailLocale): string {
  const who = esc(o.type === "b2b" && o.companyName ? o.companyName : o.customerName);
  return p(t(l, { en: `Hello ${who},`, fr: `Bonjour ${who},`, ar: `مرحباً ${who}،` }));
}

interface Copy {
  subject: L3;
  heading: L3;
  intro: (o: OrderEmailData, l: EmailLocale) => string;
  button: L3;
}

const n = (o: OrderEmailData) => `<strong dir="ltr">${esc(o.orderNumber)}</strong>`;

const COPY: Record<OrderEmailKind, Copy> = {
  placed: {
    subject: {
      en: "Your IOMA Paris order {n}",
      fr: "Votre commande IOMA Paris {n}",
      ar: "طلبكم من IOMA Paris رقم {n}",
    },
    heading: {
      en: "Thank you for your order",
      fr: "Merci pour votre commande",
      ar: "شكراً لطلبكم",
    },
    intro: (o, l) => {
      const state =
        o.paymentStatus === "paid"
          ? t(l, {
              en: "Your payment has been received.",
              fr: "Votre paiement a bien été reçu.",
              ar: "تم استلام دفعتكم.",
            })
          : o.paymentStatus === "pending" || o.paymentStatus === "authorized"
            ? t(l, {
                en: "Your order is awaiting payment.",
                fr: "Votre commande est en attente de paiement.",
                ar: "طلبكم بانتظار الدفع.",
              })
            : "";
      const pro =
        o.type === "b2b"
          ? t(l, {
              en: " This is a professional order: the prices below are your IOMA trade prices.",
              fr: " Il s'agit d'une commande professionnelle : les prix ci-dessous sont vos prix professionnels IOMA.",
              ar: " هذا طلب احترافي: الأسعار أدناه هي أسعار الجملة الخاصة بكم من IOMA.",
            })
          : "";
      return (
        p(
          t(l, {
            en: `We have received your order ${n(o)}.${pro} ${state}`,
            fr: `Nous avons bien reçu votre commande ${n(o)}.${pro} ${state}`,
            ar: `استلمنا طلبكم رقم ${n(o)}.${pro} ${state}`,
          }),
        ) +
        p(
          t(l, {
            en: "We will email you again when your order is confirmed, shipped and delivered.",
            fr: "Nous vous écrirons de nouveau lorsque votre commande sera confirmée, expédiée et livrée.",
            ar: "سنراسلكم مجدداً عند تأكيد طلبكم وشحنه وتسليمه.",
          }),
        )
      );
    },
    button: { en: "View my order", fr: "Voir ma commande", ar: "عرض طلبي" },
  },
  payment_received: {
    subject: {
      en: "Payment received for order {n}",
      fr: "Paiement reçu pour la commande {n}",
      ar: "تم استلام الدفع للطلب {n}",
    },
    heading: { en: "Payment received", fr: "Paiement reçu", ar: "تم استلام الدفع" },
    intro: (o, l) =>
      p(
        t(l, {
          en: `We have received your payment for order ${n(o)}.${o.fulfillmentStatus === "pending" ? "" : " Your order is confirmed and is being prepared."}`,
          fr: `Nous avons bien reçu votre paiement pour la commande ${n(o)}.${o.fulfillmentStatus === "pending" ? "" : " Votre commande est confirmée et en cours de préparation."}`,
          ar: `استلمنا دفعتكم للطلب رقم ${n(o)}.${o.fulfillmentStatus === "pending" ? "" : " تم تأكيد طلبكم وهو قيد التجهيز."}`,
        }),
      ),
    button: { en: "View my order", fr: "Voir ma commande", ar: "عرض طلبي" },
  },
  confirmed: {
    subject: {
      en: "Your order {n} is confirmed",
      fr: "Votre commande {n} est confirmée",
      ar: "تم تأكيد طلبكم {n}",
    },
    heading: { en: "Order confirmed", fr: "Commande confirmée", ar: "تم تأكيد الطلب" },
    intro: (o, l) =>
      p(
        t(l, {
          en: `Our team has confirmed your order ${n(o)} and is now preparing it.`,
          fr: `Notre équipe a confirmé votre commande ${n(o)} et la prépare.`,
          ar: `أكّد فريقنا طلبكم رقم ${n(o)} ويقوم الآن بتجهيزه.`,
        }),
      ),
    button: { en: "View my order", fr: "Voir ma commande", ar: "عرض طلبي" },
  },
  shipped: {
    subject: {
      en: "Your order {n} has shipped",
      fr: "Votre commande {n} a été expédiée",
      ar: "تم شحن طلبكم {n}",
    },
    heading: {
      en: "Your order is on its way",
      fr: "Votre commande est en route",
      ar: "طلبكم في الطريق إليكم",
    },
    intro: (o, l) => {
      const track = o.trackingNumber
        ? p(
            t(l, {
              en: `Carrier: <strong>${esc(o.shippingProvider ?? "-")}</strong><br>Tracking number: <strong dir="ltr">${esc(o.trackingNumber)}</strong>`,
              fr: `Transporteur : <strong>${esc(o.shippingProvider ?? "-")}</strong><br>Numéro de suivi : <strong dir="ltr">${esc(o.trackingNumber)}</strong>`,
              ar: `شركة الشحن: <strong>${esc(o.shippingProvider ?? "-")}</strong><br>رقم التتبع: <strong dir="ltr">${esc(o.trackingNumber)}</strong>`,
            }) +
              (o.trackingUrl
                ? `<br><a href="${esc(o.trackingUrl)}" style="color:#8a7f6d;">${esc(t(l, { en: "Track my parcel", fr: "Suivre mon colis", ar: "تتبع الشحنة" }))}</a>`
                : ""),
          )
        : "";
      return (
        p(
          t(l, {
            en: `Good news: order ${n(o)} has been shipped.`,
            fr: `Bonne nouvelle : la commande ${n(o)} a été expédiée.`,
            ar: `خبر سار: تم شحن الطلب رقم ${n(o)}.`,
          }),
        ) + track
      );
    },
    button: { en: "View my order", fr: "Voir ma commande", ar: "عرض طلبي" },
  },
  delivered: {
    subject: {
      en: "Your order {n} was delivered",
      fr: "Votre commande {n} a été livrée",
      ar: "تم تسليم طلبكم {n}",
    },
    heading: { en: "Order delivered", fr: "Commande livrée", ar: "تم تسليم الطلب" },
    intro: (o, l) =>
      p(
        t(l, {
          en: `Order ${n(o)} has been delivered. We hope you enjoy your IOMA Paris products.`,
          fr: `La commande ${n(o)} a été livrée. Nous espérons que vous apprécierez vos produits IOMA Paris.`,
          ar: `تم تسليم الطلب رقم ${n(o)}. نأمل أن تستمتعوا بمنتجات IOMA Paris.`,
        }),
      ),
    button: { en: "View my order", fr: "Voir ma commande", ar: "عرض طلبي" },
  },
  cancelled: {
    subject: {
      en: "Your order {n} has been cancelled",
      fr: "Votre commande {n} a été annulée",
      ar: "تم إلغاء طلبكم {n}",
    },
    heading: { en: "Order cancelled", fr: "Commande annulée", ar: "تم إلغاء الطلب" },
    intro: (o, l) =>
      p(
        t(l, {
          en: `Order ${n(o)} has been cancelled. If you have a question about this cancellation or about a refund, please contact us.`,
          fr: `La commande ${n(o)} a été annulée. Pour toute question sur cette annulation ou sur un remboursement, contactez-nous.`,
          ar: `تم إلغاء الطلب رقم ${n(o)}. إذا كان لديكم أي سؤال حول الإلغاء أو الاسترداد فيرجى التواصل معنا.`,
        }),
      ),
    button: { en: "View my order", fr: "Voir ma commande", ar: "عرض طلبي" },
  },
  refunded: {
    subject: {
      en: "Refund for order {n}",
      fr: "Remboursement de la commande {n}",
      ar: "استرداد المبلغ للطلب {n}",
    },
    heading: {
      en: "Payment refunded",
      fr: "Paiement remboursé",
      ar: "تم استرداد المبلغ",
    },
    intro: (o, l) =>
      p(
        t(l, {
          en: `Your payment for order ${n(o)} has been marked as refunded. Depending on your bank, it can take a few business days to appear on your statement.`,
          fr: `Votre paiement pour la commande ${n(o)} a été marqué comme remboursé. Selon votre banque, il peut falloir quelques jours ouvrés pour qu'il apparaisse sur votre relevé.`,
          ar: `تم تسجيل استرداد دفعتكم للطلب رقم ${n(o)}. وبحسب مصرفكم قد يستغرق ظهوره في كشف الحساب بضعة أيام عمل.`,
        }),
      ),
    button: { en: "View my order", fr: "Voir ma commande", ar: "عرض طلبي" },
  },
  cancelled_refunded: {
    subject: {
      en: "Your order {n} was cancelled and refunded",
      fr: "Votre commande {n} a été annulée et remboursée",
      ar: "تم إلغاء طلبكم {n} واسترداد المبلغ",
    },
    heading: {
      en: "Order cancelled and refunded",
      fr: "Commande annulée et remboursée",
      ar: "تم إلغاء الطلب واسترداد المبلغ",
    },
    intro: (o, l) =>
      p(
        t(l, {
          en: `Order ${n(o)} has been cancelled and your payment has been marked as refunded. Depending on your bank, it can take a few business days to appear on your statement.`,
          fr: `La commande ${n(o)} a été annulée et votre paiement a été marqué comme remboursé. Selon votre banque, il peut falloir quelques jours ouvrés pour qu'il apparaisse sur votre relevé.`,
          ar: `تم إلغاء الطلب رقم ${n(o)} وتسجيل استرداد دفعتكم. وبحسب مصرفكم قد يستغرق ظهور المبلغ في كشف الحساب بضعة أيام عمل.`,
        }),
      ),
    button: { en: "View my order", fr: "Voir ma commande", ar: "عرض طلبي" },
  },
};

/** Email sent to the customer or professional partner. Only ever shows the prices stored on the order. */
export function customerOrderEmail(kind: OrderEmailKind, o: OrderEmailData): BuiltEmail {
  const l = toEmailLocale(o.locale);
  const c = COPY[kind];
  const subjectPrefix = o.type === "b2b" ? "" : "";
  return {
    subject:
      subjectPrefix + t(l, c.subject).replace("{n}", o.orderNumber).replace(/\s+/g, " "),
    html: layout({
      locale: l,
      eyebrow:
        o.type === "b2b"
          ? t(l, {
              en: "Professional order",
              fr: "Commande professionnelle",
              ar: "طلب احترافي",
            })
          : t(l, { en: "Your order", fr: "Votre commande", ar: "طلبكم" }),
      heading: t(l, c.heading),
      bodyHtml: greeting(o, l) + c.intro(o, l) + summary(o, l) + support(o, l),
      button: { label: t(l, c.button), url: o.orderUrl },
    }),
  };
}

/** Internal notification to the IOMA team (always English). */
export function adminOrderEmail(o: OrderEmailData): BuiltEmail {
  const l: EmailLocale = "en";
  const channel = o.type === "b2b" ? "B2B" : "B2C";
  const who = o.type === "b2b" && o.companyName ? o.companyName : o.customerName;
  const contact = [
    `<strong>${esc(o.customerName)}</strong>`,
    o.companyName ? esc(o.companyName) : "",
    `<a href="mailto:${esc(o.customerEmail)}" style="color:#8a7f6d;">${esc(o.customerEmail)}</a>`,
    o.customerPhone ? `<span dir="ltr">${esc(o.customerPhone)}</span>` : "",
  ]
    .filter(Boolean)
    .join("<br>");
  const shipMethod = o.shippingMinor === 3000 ? "Express" : "Standard";
  const body =
    p(
      `A new <strong>${channel}</strong> order was placed${o.type === "b2b" ? " by a professional partner at trade prices" : ""}.`,
    ) +
    infoBlock(
      "Order",
      `<strong dir="ltr">${esc(o.orderNumber)}</strong> &middot; ${esc(formatDate(o.createdAt, l))}`,
    ) +
    infoBlock(o.type === "b2b" ? "Professional" : "Customer", contact) +
    itemsTable(o, l, true) +
    totalsTable(o, l) +
    infoBlock(
      "Payment",
      `${esc(paymentMethodLabel(o.paymentMethod, l))}<br><strong>${esc(paymentStatusLabel(o.paymentStatus, l))}</strong>`,
    ) +
    infoBlock("Delivery", `${esc(shipMethod)}<br>${addressBlock(o.shippingAddress)}`);
  return {
    subject:
      `[${channel}] New order ${o.orderNumber} - ${moneyText(o.totalMinor, o.currency)} - ${who}`.replace(
        /\s+/g,
        " ",
      ),
    html: layout({
      locale: l,
      eyebrow: `New ${channel} order`,
      heading: `${o.orderNumber}`,
      bodyHtml: body,
      button: { label: "Open in admin", url: o.adminUrl },
      note: "Order link:",
    }),
  };
}
