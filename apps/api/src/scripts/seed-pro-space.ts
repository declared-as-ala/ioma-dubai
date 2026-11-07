/**
 * Seeds the pro-space content named in the B2B brief (training videos, cabin gallery,
 * documents) so the pages have their structure from day one. Idempotent (upsert by
 * `seedKey`), never overwrites what the back office edited afterwards beyond the seed
 * defaults, and invents no files: videos have no `videoUrl` and documents have no file
 * until IEVA supplies them (the UI shows "coming soon" / "file to be supplied").
 *
 *   pnpm --filter @ioma/api seed:pro-space
 */
import mongoose from "mongoose";

type L = { en: string; ar: string };
const l = (en: string, ar: string): L => ({ en, ar });
const photo = (n: string) => ({
  image: `/images/pro/${n}.jpg`,
  preview: `/images/pro/${n}-preview.jpg`,
});

const videos = [
  {
    key: "welcome",
    category: "sales",
    title: l("Welcome to IOMA Pro", "مرحباً بك في IOMA Pro"),
    preview: "/images/pro/shop-preview.jpg",
  },
  {
    key: "selling",
    category: "sales",
    title: l(
      "Selling IOMA: recommending the right routine",
      "بيع IOMA: اقتراح الروتين المناسب",
    ),
    preview: "/images/pro/advisor-preview.jpg",
  },
  {
    key: "techniques",
    category: "sales",
    title: l(
      "Sales techniques: from diagnosis to basket",
      "تقنيات البيع: من التشخيص إلى السلة",
    ),
    preview: "/images/pro/inlab-preview.jpg",
  },
  {
    key: "eclat",
    category: "treatments",
    title: l(
      "Protocol: Mon Soin IOMA Éclat (30 min)",
      "بروتوكول: Mon Soin IOMA Éclat (30 دقيقة)",
    ),
    preview: "/images/pro/gallery-1-preview.jpg",
  },
  {
    key: "excellence",
    category: "treatments",
    title: l(
      "Protocol: Mon Soin IOMA Excellence (90 min)",
      "بروتوكول: Mon Soin IOMA Excellence (90 دقيقة)",
    ),
    preview: "/images/pro/gallery-2-preview.jpg",
  },
  {
    key: "cocoon",
    category: "treatments",
    title: l("Cocoon body treatments", "علاجات Cocoon للجسم"),
    preview: "/images/pro/gallery-4-preview.jpg",
  },
  {
    key: "diagnosis",
    category: "diagnosis_inlab",
    title: l("Running the skin diagnosis", "إجراء تشخيص البشرة"),
    preview: "/images/pro/advisor-preview.jpg",
  },
  {
    key: "macreme",
    category: "diagnosis_inlab",
    title: l(
      "Preparing Ma Crème with IOMA In.Lab",
      "تحضير Ma Crème باستخدام IOMA In.Lab",
    ),
    preview: "/images/pro/inlab-preview.jpg",
  },
];

const gallery = [
  {
    key: "g1",
    category: "cabins",
    title: l("IOMA cabin", "كابينة IOMA"),
    ...photo("gallery-1"),
  },
  {
    key: "g2",
    category: "cabins",
    title: l("IOMA cabin", "كابينة IOMA"),
    ...photo("gallery-2"),
  },
  {
    key: "g3",
    category: "cabins",
    title: l("IOMA cabin", "كابينة IOMA"),
    ...photo("gallery-3"),
  },
  {
    key: "g4",
    category: "corners",
    title: l("IOMA corner", "ركن IOMA"),
    ...photo("gallery-4"),
  },
  {
    key: "g5",
    category: "corners",
    title: l("IOMA corner", "ركن IOMA"),
    ...photo("gallery-5"),
  },
  {
    key: "g6",
    category: "spaces",
    title: l("IOMA space", "مساحة IOMA"),
    ...photo("gallery-6"),
  },
  {
    key: "g7",
    category: "spaces",
    title: l("IOMA space", "مساحة IOMA"),
    ...photo("gallery-7"),
  },
];

const documents = [
  {
    key: "price_list",
    kind: "price_list",
    access: "validated",
    title: l("Trade price list", "قائمة الأسعار المهنية"),
  },
  {
    key: "order_form",
    kind: "order_form",
    access: "validated",
    title: l("Order form", "نموذج الطلب"),
  },
  {
    key: "terms_of_sale",
    kind: "terms_of_sale",
    access: "validated",
    title: l("Terms of sale", "شروط البيع"),
  },
  {
    key: "catalogue",
    kind: "catalogue",
    access: "validated",
    title: l("Product catalogue", "كتالوج المنتجات"),
  },
  {
    key: "protocol_guides",
    kind: "protocol_guides",
    access: "customer",
    title: l("Treatment protocol guides", "أدلة بروتوكولات العلاج"),
  },
  {
    key: "brand_book",
    kind: "brand_book",
    access: "customer",
    title: l("Brand book", "كتيّب العلامة"),
  },
];

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is required.");
  await mongoose.connect(uri);
  const db = mongoose.connection.db!;
  const now = new Date();
  let created = 0;

  async function upsert(
    collection: string,
    seedKey: string,
    doc: Record<string, unknown>,
  ) {
    const res = await db
      .collection(collection)
      .updateOne(
        { seedKey },
        {
          $setOnInsert: {
            seedKey,
            ...doc,
            status: "published",
            createdAt: now,
            updatedAt: now,
          },
        },
        { upsert: true },
      );
    if (res.upsertedCount) created += 1;
  }

  for (const [i, v] of videos.entries())
    await upsert("provideos", `video:${v.key}`, {
      title: v.title,
      category: v.category,
      preview: v.preview,
      videoUrl: "",
      durationMinutes: null,
      sortOrder: i,
    });
  for (const [i, g] of gallery.entries())
    await upsert("prophotos", `photo:${g.key}`, {
      title: g.title,
      category: g.category,
      image: g.image,
      preview: g.preview,
      sortOrder: i,
    });
  for (const [i, d] of documents.entries())
    await upsert("prodocuments", `doc:${d.key}`, {
      title: d.title,
      kind: d.kind,
      requiredAccess: d.access,
      fileDocumentId: null,
      sortOrder: i,
    });
  // Default settings document (rule left open: minimum amount / validity are decided with IEVA).
  await db
    .collection("b2bsettings")
    .updateOne(
      { key: "b2b" },
      {
        $setOnInsert: {
          key: "b2b",
          minFirstOrderMinor: 0,
          unlockOn: "confirmed",
          validMonths: null,
          teamEmail: "",
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true },
    );

  console.log(`Pro space seed done: ${created} new record(s).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
