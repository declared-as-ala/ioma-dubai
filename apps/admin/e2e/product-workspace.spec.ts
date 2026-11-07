import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import en from "../messages/en.json";
import fr from "../messages/fr.json";
import ar from "../messages/ar.json";
const api = "http://localhost:4000/api";
let session: any, id: string, slug: string;
const headers = () => ({ Authorization: `Bearer ${session.accessToken}` });
test.describe.configure({ mode: "serial" });
test.beforeAll(async ({ request }) => {
  session = await (
    await request.post(`${api}/auth/login`, {
      data: { email: "admin@ioma-dev.local", password: "ChangeMe123!" },
    })
  ).json();
  const list = await (
    await request.get(`${api}/admin/resources/products?q=Duo%20soins%20du%20corps`, {
      headers: headers(),
    })
  ).json();
  expect(list.items.length).toBeGreaterThan(0);
  const copy = await request.post(
    `${api}/admin/products/${list.items[0]._id}/duplicate`,
    { headers: headers() },
  );
  expect(copy.ok()).toBeTruthy();
  id = (await copy.json()).id;
  slug = `qa-media-${Date.now()}`;
  expect(
    (
      await request.patch(`${api}/admin/resources/products/${id}`, {
        headers: headers(),
        data: { slug },
      })
    ).ok(),
  ).toBeTruthy();
});
test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    (s) => localStorage.setItem("ioma_auth", JSON.stringify({ state: s, version: 0 })),
    session,
  );
});
test.afterAll(async ({ request }) => {
  if (id)
    await request.patch(`${api}/admin/resources/products/${id}`, {
      headers: headers(),
      data: { status: "archived" },
    });
});

test("one workspace retains draft across tabs, uploads, prices, saves and reloads", async ({
  page,
  request,
}) => {
  test.setTimeout(180000);
  await page.goto(`/en/admin/products/${id}`);
  await page.getByRole("button", { name: en.AdminExperience.edit, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/products/${id}$`));
  const name = page.getByRole("textbox", {
    name: `${en.AdminExperience.fields.name} · EN`,
    exact: true,
  });
  await name.fill("QA workspace body duo");
  await page.getByRole("tab", { name: en.ProductAdmin.media, exact: true }).click();
  await page
    .getByLabel(en.ProductAdmin.upload, { exact: true })
    .setInputFiles(resolve("public/images/products/calm.png"));
  await expect(page.getByText(en.ProductAdmin.previewBeforeSave)).toBeVisible();
  await page.getByRole("tab", { name: en.ProductAdmin.pricing, exact: true }).click();
  await page
    .getByRole("button", { name: en.ProductAdmin.addVariant, exact: true })
    .click();
  await page.getByLabel(en.AdminExperience.fields.sku, { exact: true }).fill(slug);
  await page.getByLabel(en.AdminExperience.fields.size, { exact: true }).fill("QA");
  await page
    .getByLabel(en.AdminExperience.fields.b2cPriceMinor, { exact: true })
    .fill("123.45");
  await page
    .getByRole("tab", { name: en.ProductAdmin.classification, exact: true })
    .click();
  const category = page.getByRole("group", {
    name: en.AdminExperience.fields.categoryIds,
    exact: true,
  });
  await category.getByRole("checkbox").first().check();
  await page.getByRole("tab", { name: en.ProductAdmin.seo, exact: true }).click();
  await page
    .getByRole("textbox", {
      name: `${en.AdminExperience.fields.seo_title} · EN`,
      exact: true,
    })
    .fill("QA body duo SEO");
  await page.getByRole("tab", { name: en.ProductAdmin.overview, exact: true }).click();
  await expect(name).toHaveValue("QA workspace body duo");
  await page
    .getByRole("button", { name: en.ProductWorkspace.saveChanges, exact: true })
    .first()
    .click();
  await expect(page.getByText(en.ProductWorkspace.updated, { exact: true })).toBeVisible({
    timeout: 30000,
  });
  await expect(page).toHaveURL(new RegExp(`/admin/products/${id}$`));
  await page.reload();
  await expect(page.locator("#admin-main h1")).toHaveText("QA workspace body duo");
  const response = await request.get(`${api}/admin/resources/products/${id}`, {
    headers: headers(),
  });
  const detail = await response.json();
  expect(detail.record.seo.title.en).toBe("QA body duo SEO");
  expect(detail.relations.variants[0].b2cPriceMinor).toBe(12345);
  expect(detail.record.media.length).toBeGreaterThan(1);
  const uploaded = detail.record.media[detail.record.media.length - 1];
  const image = await request.get(`http://localhost:4000${uploaded.url}`);
  expect(image.ok()).toBeTruthy();
  expect(image.headers()["content-type"]).toContain("image/webp");
  await page.getByRole("button", { name: en.AdminExperience.edit, exact: true }).click();
  await page.getByRole("tab", { name: en.ProductAdmin.pricing, exact: true }).click();
  await page
    .getByRole("button", { name: en.AdminExperience.stockAdjustment, exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel(en.AdminExperience.fields.delta, { exact: true })
    .fill("1");
  await page
    .getByRole("dialog")
    .getByLabel(en.AdminExperience.fields.reason, { exact: true })
    .fill("Temporary workspace QA adjustment");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: en.AdminExperience.save, exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const stockDetail = await (
    await request.get(`${api}/admin/resources/products/${id}`, { headers: headers() })
  ).json();
  expect(stockDetail.relations.variants[0].quantityOnHand).toBe(1);
  await page
    .getByRole("button", { name: en.AdminExperience.cancel, exact: true })
    .first()
    .click();
  await page.getByRole("tab", { name: en.ProductAdmin.media, exact: true }).click();
  await expect(
    page.locator('#admin-main img[src*="/api/media/products/"]').first(),
  ).toBeVisible();
});

test("legacy route, validation, cancel, navigation and failed-save recovery", async ({
  page,
}) => {
  test.setTimeout(180000);
  await page.goto(`/en/admin/products/${id}/edit`);
  await expect(page).toHaveURL(new RegExp(`/products/${id}\\?mode=edit$`));
  const name = page.getByRole("textbox", {
    name: `${en.AdminExperience.fields.name} · EN`,
    exact: true,
  });
  await expect(name).toBeVisible();
  await name.fill("QA unsaved retained");
  await page
    .getByRole("button", { name: en.AdminExperience.cancel, exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: en.ProductWorkspace.continueEditing, exact: true })
    .click();
  await expect(name).toHaveValue("QA unsaved retained");
  await page
    .locator("aside")
    .getByRole("link", { name: en.AdminExperience.resources.orders, exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: en.ProductWorkspace.continueEditing, exact: true })
    .click();
  await page.goBack();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("button", { name: en.ProductWorkspace.continueEditing, exact: true })
    .click();
  await expect(name).toHaveValue("QA unsaved retained");
  await page
    .getByLabel(en.AdminExperience.fields.slug, { exact: true })
    .fill("INVALID SLUG");
  await page
    .getByRole("button", { name: en.ProductWorkspace.saveChanges, exact: true })
    .first()
    .click();
  await expect(
    page.getByText(en.ProductWorkspace.validation_slug, { exact: true }),
  ).toBeVisible();
  await page.getByLabel(en.AdminExperience.fields.slug, { exact: true }).fill(slug);
  let fail = true;
  await page.route(`**/api/admin/resources/products/${id}`, async (route) => {
    if (fail && route.request().method() === "PATCH") {
      fail = false;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ message: "Temporary save failure" }),
      });
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: en.ProductWorkspace.saveChanges, exact: true })
    .first()
    .click();
  await expect(page.getByText(/Temporary save failure/)).toBeVisible();
  await expect(name).toHaveValue("QA unsaved retained");
  await page
    .getByRole("button", { name: en.ProductWorkspace.saveChanges, exact: true })
    .first()
    .click();
  await expect(page.getByText(en.ProductWorkspace.updated, { exact: true })).toBeVisible({
    timeout: 30000,
  });
  await page.getByRole("button", { name: en.AdminExperience.edit, exact: true }).click();
  await name.fill("QA discard this");
  await page
    .getByRole("button", { name: en.AdminExperience.cancel, exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: en.ProductWorkspace.discardChanges, exact: true })
    .click();
  await expect(page.locator("#admin-main h1")).toHaveText("QA unsaved retained");
});

test("cabin pricing uses its professional price and archive requires the action", async ({
  page,
  request,
}) => {
  const detail = await (
    await request.get(`${api}/admin/resources/products/${id}`, { headers: headers() })
  ).json();
  const variant = detail.relations.variants[0];
  try {
    expect(
      (
        await request.patch(`${api}/admin/resources/inventory/${variant._id}`, {
          headers: headers(),
          data: { b2cPriceMinor: 0, b2bPriceMinor: 12345 },
        })
      ).ok(),
    ).toBeTruthy();
    expect(
      (
        await request.patch(`${api}/admin/resources/products/${id}`, {
          headers: headers(),
          data: { visibility: "b2b_cabin" },
        })
      ).ok(),
    ).toBeTruthy();
    await page.goto(`/en/admin/products/${id}`);
    await expect(page.locator("#admin-main h1")).toBeVisible();
    await expect(
      page
        .locator("#admin-main header")
        .getByText(en.ProductAdmin.pricePending, { exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: en.AdminExperience.edit, exact: true })
      .click();
    await expect(
      page
        .getByLabel(en.AdminExperience.fields.status, { exact: true })
        .locator('option[value="archived"]'),
    ).toHaveCount(0);
  } finally {
    await request.patch(`${api}/admin/resources/products/${id}`, {
      headers: headers(),
      data: { visibility: detail.record.visibility },
    });
    await request.patch(`${api}/admin/resources/inventory/${variant._id}`, {
      headers: headers(),
      data: {
        b2cPriceMinor: variant.b2cPriceMinor,
        b2bPriceMinor: variant.b2bPriceMinor,
      },
    });
  }
});

test("create uses the shared tabs and supports incomplete drafts", async ({ page }) => {
  await page.goto("/en/admin/products/new");
  await page
    .getByRole("textbox", { name: `${en.AdminExperience.fields.name} · EN`, exact: true })
    .fill("QA workspace draft");
  await page
    .getByLabel(en.AdminExperience.fields.slug, { exact: true })
    .fill(`qa-media-${Date.now()}`);
  await page
    .getByRole("group", { name: en.AdminExperience.fields.rangeId, exact: true })
    .getByRole("radio")
    .first()
    .check();
  await page.getByRole("tab", { name: en.ProductAdmin.media, exact: true }).click();
  await page
    .getByLabel(en.ProductAdmin.upload, { exact: true })
    .setInputFiles(resolve("public/images/products/hydra.png"));
  await page
    .getByRole("button", { name: en.ProductWorkspace.saveChanges, exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/admin\/products\/[a-f\d]{24}$/, { timeout: 30000 });
  await expect(page.locator("#admin-main h1")).toHaveText("QA workspace draft");
});

for (const locale of ["en", "fr", "ar"] as const)
  for (const width of [390, 768, 1024, 1280, 1440]) {
    test(`workspace tabs ${locale} ${width}`, async ({ page }) => {
      test.setTimeout(120000);
      const t = { en, fr, ar }[locale];
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/admin/products/${id}`);
      await page
        .getByRole("button", { name: t.AdminExperience.edit, exact: true })
        .click();
      for (const tab of [
        "overview",
        "media",
        "pricing",
        "classification",
        "routine",
        "ingredients",
        "seo",
        "translations",
        "technical",
      ] as const) {
        await page.getByRole("tab", { name: t.ProductAdmin[tab], exact: true }).click();
        await expect(page.getByRole("tabpanel")).toBeVisible();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        ).toBeTruthy();
        if (["overview", "media", "pricing", "translations"].includes(tab))
          await page.screenshot({
            path: `../../scratch/workspace-browser/${locale}-${width}-${tab}.png`,
            fullPage: true,
          });
      }
      await expect(page.locator('a[href*="/admin/notifications"]')).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  }
