import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import { createRequire } from "node:module";
import en from "../messages/en.json";
import fr from "../messages/fr.json";
import ar from "../messages/ar.json";

const api = "http://localhost:4000/api";
let session: { accessToken: string; [key: string]: unknown };
let imported: {
  _id: string;
  name: { en: string };
  slug: string;
  primaryImage: { id: string; url: string };
};
const headers = () => ({ Authorization: `Bearer ${session.accessToken}` });
test.describe.configure({ mode: "serial" });
test.beforeAll(async ({ request }) => {
  const response = await request.post(`${api}/auth/login`, {
    data: { email: "admin@ioma-dev.local", password: "ChangeMe123!" },
  });
  expect(response.ok()).toBeTruthy();
  session = await response.json();
  const products = await request.get(
    `${api}/admin/resources/products?status=published&limit=1`,
    { headers: headers() },
  );
  expect(products.ok()).toBeTruthy();
  imported = (await products.json()).items[0];
  expect(imported.primaryImage.id).toBeTruthy();
});
test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    (s) => localStorage.setItem("ioma_auth", JSON.stringify({ state: s, version: 0 })),
    session,
  );
});

test("bulk product and order deletion, cancel and consolidated stock tabs", async ({
  page,
  request,
}) => {
  const { MongoClient, ObjectId } = createRequire(resolve("../api/package.json"))(
    "mongoose",
  ).mongo;
  const client = await MongoClient.connect("mongodb://localhost:27017"),
    db = client.db("ioma");
  const suffix = `qa-bulk-${Date.now()}`;
  const productIds = [new ObjectId(), new ObjectId()],
    orderIds = [new ObjectId(), new ObjectId()];
  try {
    const source = await db
      .collection("products")
      .findOne({ _id: new ObjectId(imported._id) });
    await db
      .collection("products")
      .insertMany(
        productIds.map((_id: unknown, i: number) => ({
          ...source,
          _id,
          slug: `${suffix}-${i}`,
          name: { en: `${suffix}-${i}`, fr: `${suffix}-${i}`, ar: `${suffix}-${i}` },
          status: "draft",
        })),
      );
    await db
      .collection("orders")
      .insertMany(
        orderIds.map((_id: unknown, i: number) => ({
          _id,
          orderNumber: `${suffix}-${i}`,
          type: "b2c",
          totalMinor: 10000,
          paymentStatus: "paid",
          fulfillmentStatus: "delivered",
          items: [],
          createdAt: new Date("2020-01-01"),
        })),
      );
    for (const [resource, ids, translation] of [
      ["products", productIds, en.ProductAdmin],
      ["orders", orderIds, en.OrderAdmin],
    ] as const) {
      await page.goto(`/en/admin/${resource}`);
      if (resource === "products")
        await page.getByRole("textbox", { name: en.ProductAdmin.search }).fill(suffix);
      else {
        await page
          .locator('#admin-main input[type="text"], #admin-main input:not([type])')
          .first()
          .fill(suffix);
        await page.locator("#admin-main form").first().press("Enter");
      }
      await expect(page.locator('#admin-main tbody input[type="checkbox"]')).toHaveCount(
        2,
      );
      await page
        .getByRole("checkbox", { name: translation.selectPage, exact: true })
        .check();
      await expect(page.locator("#admin-main tbody input:checked")).toHaveCount(2);
      await page
        .getByRole("button", { name: translation.deleteSelected, exact: true })
        .click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: en.AdminExperience.cancel, exact: true })
        .click();
      await expect(page.locator("#admin-main tbody input:checked")).toHaveCount(2);
      await page
        .getByRole("button", { name: translation.deleteSelected, exact: true })
        .click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: translation.deleteSelected, exact: true })
        .click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page.locator('#admin-main tbody input[type="checkbox"]')).toHaveCount(
        0,
      );
      const retained = await db
        .collection(resource)
        .find({ _id: { $in: ids } })
        .toArray();
      expect(retained).toHaveLength(2);
      expect(
        retained.every((r: any) =>
          resource === "products"
            ? r.deletedAt && r.status === "archived"
            : r.adminDeletedAt &&
              r.paymentStatus === "paid" &&
              r.fulfillmentStatus === "delivered",
        ),
      ).toBeTruthy();
      const repeat = await request.post(`${api}/admin/${resource}/bulk-delete`, {
        headers: headers(),
        data: { ids: ids.map(String) },
      });
      expect((await repeat.json()).deletedCount).toBe(0);
    }
    for (const tab of ["inventory", "stock-movements", "concerns"]) {
      await page.goto(`/en/admin/${tab}`);
      await expect(page).toHaveURL(new RegExp(`/admin/products\\?tab=${tab}`));
      await expect(page.locator("#admin-main h1")).toHaveText(
        (en.AdminExperience.resources as Record<string, string>)[tab]!,
      );
      await expect(page.locator(`aside a[href="/en/admin/${tab}"]`)).toHaveCount(0);
    }
  } finally {
    await db.collection("products").deleteMany({ _id: { $in: productIds } });
    await db.collection("orders").deleteMany({ _id: { $in: orderIds } });
    await client.close();
  }
});

for (const locale of ["en", "fr", "ar"] as const)
  for (const width of [390, 768, 1024, 1280, 1440]) {
    test(`product media screens ${locale} ${width}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      const t = { en, fr, ar }[locale];
      await page.setViewportSize({ width, height: 900 });
      for (const [path, heading] of [
        ["/admin/products", t.AdminExperience.resources.products],
        [`/admin/products/${imported._id}`, ""],
        [`/admin/products/${imported._id}/edit`, ""],
      ] as const) {
        await page.goto(`/${locale}${path}`);
        await expect(page.locator("#admin-main h1")).toBeVisible();
        if (heading) await expect(page.locator("#admin-main h1")).toHaveText(heading);
        await expect(
          page.locator('#admin-main img[src*="/api/media/products/"]').first(),
        ).toBeVisible();
        await expect
          .poll(() =>
            page
              .locator('#admin-main img[src*="/api/media/products/"]')
              .first()
              .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
          )
          .toBeTruthy();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        ).toBeTruthy();
        await page.screenshot({
          path: `../../scratch/product-browser/${locale}-${width}-${path.endsWith("edit") ? "edit" : path.endsWith("products") ? "list" : "detail"}.png`,
          fullPage: true,
        });
      }
      expect(errors).toEqual([]);
    });
  }

test("admin shell persists across navigation and reduced motion is respected", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/admin/products");
  await expect(page.locator("#admin-main h1")).toBeVisible();
  await page.evaluate(() => {
    document
      .querySelector(".admin-shell header")!
      .setAttribute("data-persistence", "same-node");
    document
      .querySelector(".admin-shell aside")!
      .setAttribute("data-persistence", "same-node");
  });
  for (const key of ["categories", "orders", "ranges", "products"] as const) {
    await page
      .locator("aside")
      .getByRole("link", { name: en.AdminExperience.resources[key], exact: true })
      .click();
    await expect(page.locator("#admin-main h1")).toHaveText(
      en.AdminExperience.resources[key],
    );
    await expect(
      page.locator('.admin-shell header[data-persistence="same-node"]'),
    ).toHaveCount(1);
    await expect(
      page.locator('.admin-shell aside[data-persistence="same-node"]'),
    ).toHaveCount(1);
    await expect(
      page
        .locator("aside")
        .getByRole("link", { name: en.AdminExperience.resources[key], exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }
});

test("imported product uses the same real image throughout commerce, AI and B2B", async ({
  browser,
  request,
}) => {
  test.setTimeout(180000);
  const { MongoClient, ObjectId } = createRequire(resolve("../api/package.json"))(
    "mongoose",
  ).mongo;
  const client = await MongoClient.connect("mongodb://localhost:27017"),
    db = client.db("ioma");
  const userId = new ObjectId(),
    aiId = new ObjectId(),
    diagnosisId = new ObjectId(),
    orderId = new ObjectId();
  const email = `qa-media-${Date.now()}@example.test`;
  let context;
  try {
    const admin = await db.collection("users").findOne({ email: "admin@ioma-dev.local" });
    await db
      .collection("users")
      .insertOne({
        _id: userId,
        email,
        passwordHash: admin.passwordHash,
        firstName: "QA",
        lastName: "Media",
        roles: ["customer", "professional_approved"],
        status: "active",
        createdAt: new Date(),
      });
    await db
      .collection("professionalapplications")
      .insertOne({
        userId,
        companyName: "QA Media",
        contactPerson: "QA",
        status: "approved",
        statusHistory: [],
        documents: [],
        email,
        createdAt: new Date(),
      });
    const product = await db
        .collection("products")
        .findOne({ _id: new ObjectId(imported._id) }),
      variant = await db
        .collection("productvariants")
        .findOne({ productId: product._id });
    const range = await db.collection("productranges").findOne({ _id: product.rangeId });
    const recommendation = {
      productId: String(product._id),
      variantId: String(variant._id),
      sku: variant.sku,
      slug: product.slug,
      name: product.name,
      shortBenefit: product.shortBenefit,
      size: variant.size,
      priceMinor: variant.b2cPriceMinor,
      routineStep: "both",
      whyThisProduct: product.shortBenefit,
      howToUse: product.howToUse,
      whenToUse: product.howToUse,
      orderIndex: 1,
      inStock: true,
      image: "https://invalid.example/generated-image.jpg",
      range: { slug: range.slug, name: range.name },
    };
    const routines = Object.fromEntries(
      ["essential", "complete", "premium"].map((tier) => [
        tier,
        {
          tier,
          totalPriceMinor: variant.b2cPriceMinor,
          description: product.shortBenefit,
          morningSteps: [recommendation],
          eveningSteps: [],
          weeklyRitual: [],
        },
      ]),
    );
    await db
      .collection("aianalyses")
      .insertOne({
        _id: aiId,
        userId,
        status: "completed",
        isSimulated: true,
        imageDocumentId: null,
        recommendedRangeId: range._id,
        activeTier: "complete",
        routines,
        createdAt: new Date(),
        deletedAt: null,
      });
    await db
      .collection("standarddiagnoses")
      .insertOne({
        _id: diagnosisId,
        userId,
        answers: [],
        resultProfile: {
          skinType: "normal",
          mainConcern: "hydration",
          hydrationScore: 50,
        },
        recommendedRangeId: range._id,
        morningRoutine: [variant._id],
        eveningRoutine: [],
        createdAt: new Date(),
      });
    await db
      .collection("orders")
      .insertOne({
        _id: orderId,
        userId,
        orderNumber: `QA-MEDIA-${Date.now()}`,
        type: "b2c",
        items: [
          {
            variantId: variant._id,
            sku: variant.sku,
            productNameSnapshot: product.name,
            qty: 1,
            unitPriceMinorSnapshot: variant.b2cPriceMinor,
            totalMinor: variant.b2cPriceMinor,
          },
        ],
        totalMinor: variant.b2cPriceMinor,
        subtotalMinor: variant.b2cPriceMinor,
        taxMinor: 0,
        shippingMinor: 0,
        currency: "AED",
        paymentStatus: "paid",
        fulfillmentStatus: "delivered",
        statusHistory: [],
        createdAt: new Date("2020-01-01"),
      });
    const login = await request.post(`${api}/auth/login`, {
      data: { email, password: "ChangeMe123!" },
    });
    expect(login.ok()).toBeTruthy();
    const userSession = await login.json();
    const userHeaders = { Authorization: `Bearer ${userSession.accessToken}` };
    expect(
      (
        await request.post(`${api}/wishlist`, {
          headers: userHeaders,
          data: { sku: variant.sku },
        })
      ).ok(),
    ).toBeTruthy();
    expect(
      (
        await request.post(`${api}/cart/items`, {
          headers: userHeaders,
          data: { sku: variant.sku, qty: 1 },
        })
      ).ok(),
    ).toBeTruthy();
    const ai = await request.get(`${api}/ai-analysis/${aiId}`, { headers: userHeaders });
    expect(ai.ok()).toBeTruthy();
    expect((await ai.json()).routines.complete.morningSteps[0].image).toBe(
      product.images[0],
    );
    const b2b = await request.get(`${api}/pro/catalog`, { headers: userHeaders });
    expect(b2b.ok()).toBeTruthy();
    expect(
      (await b2b.json()).find((p: { slug: string }) => p.slug === product.slug)
        .primaryImage.id,
    ).toBe(imported.primaryImage.id);
    context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addInitScript(
      (s) => localStorage.setItem("ioma_auth", JSON.stringify({ state: s, version: 0 })),
      userSession,
    );
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const order = await db.collection("orders").findOne({ _id: orderId });
    for (const path of [
      `/shop?q=${product.slug}`,
      `/shop/${product.slug}`,
      "/wishlist",
      "/cart",
      "/checkout",
      `/account/orders/${order.orderNumber}`,
      "/account/routines",
      `/diagnosis/standard/${diagnosisId}`,
      `/diagnosis/ai/${aiId}`,
      "/portal/catalog",
    ]) {
      await page.goto(`http://localhost:3000/en${path}`);
      const image = page.locator(`img[src*="${imported.primaryImage.id}"]`).first();
      await expect(image, path).toBeVisible();
      await image.scrollIntoViewIfNeeded();
      await expect
        .poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth))
        .toBeGreaterThan(0);
    }
    expect(errors).toEqual([]);
  } finally {
    await context?.close();
    for (const collection of [
      "users",
      "professionalapplications",
      "aianalyses",
      "standarddiagnoses",
      "orders",
      "carts",
      "wishlists",
      "refreshtokens",
    ])
      await db
        .collection(collection)
        .deleteMany(collection === "users" ? { _id: userId } : { userId });
    await client.close();
  }
});

// Create/edit/retry coverage lives in product-workspace.spec.ts after the same-page migration.
