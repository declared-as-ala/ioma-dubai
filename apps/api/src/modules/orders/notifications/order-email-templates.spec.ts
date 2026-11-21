import {
  adminOrderEmail,
  customerOrderEmail,
  pickName,
  type OrderEmailData,
  type OrderEmailKind,
} from "./order-email-templates";

const base: OrderEmailData = {
  orderNumber: "IOMA-20261121-ABC123",
  createdAt: new Date("2026-11-21T10:30:00Z"),
  type: "b2c",
  locale: "en",
  customerName: "Layla Haddad",
  companyName: null,
  customerEmail: "layla@example.test",
  customerPhone: "+971500000000",
  items: [
    {
      name: { en: "Day Cream", fr: "Ma Crème Jour", ar: "كريم النهار" },
      sku: "IBP104",
      qty: 2,
      unitMinor: 23_000,
      totalMinor: 46_000,
      imageUrl: "https://iomaparis.ae/images/products/ma-creme-jour-1.jpg",
    },
    {
      name: { en: "Serum <b>X</b>", fr: "Sérum", ar: "" },
      sku: "SRM1",
      qty: 1,
      unitMinor: 15_050,
      totalMinor: 15_050,
    },
  ],
  subtotalMinor: 61_050,
  taxMinor: 3_053,
  shippingMinor: 0,
  totalMinor: 64_103,
  currency: "AED",
  shippingAddress: {
    fullName: "Layla Haddad",
    phone: "+971500000000",
    emirate: "Dubai",
    city: "Dubai",
    addressLine1: "Marina Walk 1",
  },
  billingAddress: null,
  paymentMethod: "demo",
  paymentStatus: "paid",
  fulfillmentStatus: "processing",
  shippingProvider: "Aramex",
  trackingNumber: "TRK123",
  trackingUrl: "https://track.example.test/TRK123",
  orderUrl: "https://iomaparis.ae/en/account/orders/IOMA-20261121-ABC123",
  adminUrl: "https://admin.iomaparis.ae/en/admin/orders?q=IOMA-20261121-ABC123",
  supportEmail: "support@iomaparis.ae",
};

const KINDS: OrderEmailKind[] = [
  "placed",
  "payment_received",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
  "cancelled_refunded",
];
const FRENCH =
  /\b(Bonjour|Merci|Commande|commande|Votre|votre|Livraison|Paiement|Nous)\b/;

describe("customer order emails", () => {
  it("shows the order number, quantities, prices, VAT, shipping and total exactly as stored", () => {
    const { html, subject } = customerOrderEmail("placed", base);
    expect(subject).toBe("Your IOMA Paris order IOMA-20261121-ABC123");
    for (const s of [
      "IOMA-20261121-ABC123",
      "230.00", // unit price
      "460.00", // line total
      "150.50",
      "610.50", // subtotal
      "30.53", // VAT
      "641.03", // total
      "2 &times;",
      "Free", // shipping above the threshold
    ])
      expect(html).toContain(s);
    expect(html).toContain("Marina Walk 1");
    expect(html).toContain("support@iomaparis.ae");
    expect(html).toContain(
      'href="https://iomaparis.ae/en/account/orders/IOMA-20261121-ABC123"',
    );
    expect(html).toContain("ma-creme-jour-1.jpg");
  });

  it("states the real payment method and status, never more", () => {
    expect(customerOrderEmail("placed", base).html).toContain("Demo payment");
    const pending = customerOrderEmail("placed", {
      ...base,
      paymentStatus: "pending",
      paymentMethod: "cash_on_delivery",
      fulfillmentStatus: "pending",
    }).html;
    expect(pending).toContain("Cash on delivery");
    expect(pending).toContain("Awaiting payment");
    expect(pending).not.toContain("Your payment has been received");
  });

  it("escapes anything a customer or product name could inject", () => {
    const { html } = customerOrderEmail("placed", {
      ...base,
      customerName: '<script>alert(1)</script>"',
    });
    expect(html).not.toContain("<script>alert");
    expect(html).not.toContain("<b>X</b>");
    expect(html).toContain("Serum &lt;b&gt;X&lt;/b&gt;");
  });

  it("B2C email never mentions trade pricing; B2B email does and greets the company", () => {
    const b2c = customerOrderEmail("placed", base).html;
    expect(b2c).not.toMatch(/trade price|professional/i);
    const b2b = customerOrderEmail("placed", {
      ...base,
      type: "b2b",
      companyName: "Serenity Spa LLC",
    });
    expect(b2b.html).toContain("Professional order");
    expect(b2b.html).toContain("trade prices");
    expect(b2b.html).toContain("Hello Serenity Spa LLC,");
  });

  it("renders every status email in English, Arabic and French without leaking another language", () => {
    for (const kind of KINDS) {
      const en = customerOrderEmail(kind, base);
      expect(en.html).not.toContain("undefined");
      expect(`${en.subject} ${en.html.replace(/<[^>]+>/g, " ")}`).not.toMatch(FRENCH);
      expect(en.subject).toContain(base.orderNumber);

      const ar = customerOrderEmail(kind, { ...base, locale: "ar" });
      expect(ar.html).toContain('dir="rtl"');
      expect(ar.html).toContain('lang="ar"');
      expect(ar.html).not.toContain("undefined");
      const arText = ar.html.replace(/<[^>]+>/g, " ");
      expect(arText).toMatch(/[؀-ۿ]/);
      expect(`${ar.subject} ${arText}`).not.toMatch(FRENCH);
      expect(ar.html).toContain("IOMA-20261121-ABC123");

      const fr = customerOrderEmail(kind, { ...base, locale: "fr" });
      expect(fr.html).toContain('lang="fr"');
      expect(fr.html).not.toContain("undefined");
    }
  });

  it("Arabic emails keep amounts and numbers left-to-right and fall back to English product names, never French", () => {
    const { html } = customerOrderEmail("placed", { ...base, locale: "ar" });
    expect(html).toContain('dir="ltr" style="white-space:nowrap;">AED&nbsp;641.03');
    expect(html).toContain("كريم النهار");
    expect(pickName({ en: "Serum", fr: "Sérum", ar: "" }, "ar")).toBe("Serum");
    expect(pickName({ en: "", fr: "Sérum", ar: "" }, "en")).toBe("Sérum");
  });

  it("only mentions tracking in the shipped email, using the order's real tracking data", () => {
    const shipped = customerOrderEmail("shipped", base);
    expect(shipped.html).toContain("TRK123");
    expect(shipped.html).toContain("Aramex");
    expect(shipped.html).toContain("https://track.example.test/TRK123");
    expect(customerOrderEmail("delivered", base).html).not.toContain("Tracking number");
    const noTrack = customerOrderEmail("shipped", { ...base, trackingNumber: null });
    expect(noTrack.html).not.toContain("Tracking number");
  });

  it("separate billing address is shown only when it differs", () => {
    expect(customerOrderEmail("placed", base).html).not.toContain("Billing address");
    const html = customerOrderEmail("placed", {
      ...base,
      billingAddress: { ...base.shippingAddress, fullName: "Accounts Dept" },
    }).html;
    expect(html).toContain("Billing address");
    expect(html).toContain("Accounts Dept");
  });
});

describe("admin order email", () => {
  it("identifies the channel in the subject and carries the contact, items, totals and admin link", () => {
    const m = adminOrderEmail(base);
    expect(m.subject).toBe(
      "[B2C] New order IOMA-20261121-ABC123 - AED 641.03 - Layla Haddad",
    );
    for (const s of [
      "layla@example.test",
      "+971500000000",
      "SKU IBP104",
      "SKU SRM1",
      "Demo payment",
      "Marina Walk 1",
      "Standard",
      base.adminUrl,
    ])
      expect(m.html).toContain(s);
    expect(m.html).toContain("641.03");
  });

  it("flags B2B orders with the company name and express delivery", () => {
    const m = adminOrderEmail({
      ...base,
      type: "b2b",
      companyName: "Serenity Spa LLC",
      shippingMinor: 3000,
    });
    expect(m.subject).toBe(
      "[B2B] New order IOMA-20261121-ABC123 - AED 641.03 - Serenity Spa LLC",
    );
    expect(m.html).toContain("trade prices");
    expect(m.html).toContain("Express");
    expect(m.html).toContain("Serenity Spa LLC");
  });
});
