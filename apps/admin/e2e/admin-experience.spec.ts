import { test, expect } from "@playwright/test";
import en from "../messages/en.json";
import fr from "../messages/fr.json";
import ar from "../messages/ar.json";
import { apiSession } from "./helpers/professional";
const api = "http://localhost:4000/api";
let session: any;
test.describe.configure({ mode: "serial" });
test.beforeAll(async ({ request }) => {
  const response = await request.post(`${api}/auth/login`, {
    data: { email: "admin@ioma-dev.local", password: "ChangeMe123!" },
  });
  expect(response.ok()).toBeTruthy();
  session = await response.json();
});
for (const locale of ["en", "fr", "ar"] as const)
  for (const width of [390, 768, 1024, 1280, 1440]) {
    test(`admin dashboard ${locale} ${width}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        (s) =>
          localStorage.setItem("ioma_auth", JSON.stringify({ state: s, version: 0 })),
        session,
      );
      await page.goto(`/${locale}/admin`);
      const t = { en, fr, ar }[locale].AdminExperience;
      await expect(
        page.getByRole("heading", { name: t.dashboard, exact: true }),
      ).toBeVisible();
      await expect(page.getByText(t.revenue, { exact: true }).first()).toBeVisible();
      await expect(page.locator('svg[role="img"]').first()).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
      ).toBeTruthy();
      await page.screenshot({
        path: `../../scratch/admin-browser/${locale}-${width}.png`,
        fullPage: true,
      });
      if ([390, 1440].includes(width))
        await page.screenshot({
          path: `../../scratch/admin-browser/${locale}-${width}-viewport.png`,
        });
      if (width < 1280) {
        await page.getByRole("button", { name: t.navigation, exact: true }).click();
        const drawer = page.getByRole("dialog");
        await expect(drawer).toBeVisible();
        await drawer
          .getByRole("link", { name: t.resources.products, exact: true })
          .click();
        await expect(page).toHaveURL(/admin\/products/);
        await expect(drawer).toHaveCount(0);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        ).toBeTruthy();
      }
      expect(errors).toEqual([]);
    });
  }
test("every admin resource opens and existing detail records load", async ({
  page,
  request,
}) => {
  test.setTimeout(180000);
  await page.addInitScript(
    (s) => localStorage.setItem("ioma_auth", JSON.stringify({ state: s, version: 0 })),
    session,
  );
  const headers = { Authorization: `Bearer ${session.accessToken}` };
  const access = await (await request.get(`${api}/admin/access`, { headers })).json();
  for (const resource of access.resources) {
    await page.goto("/en/admin/" + resource.key);
    await expect(
      page
        .getByRole("heading", {
          name: (en.AdminExperience.resources as any)[resource.key],
          exact: true,
        })
        .first(),
    ).toBeVisible();
    await expect(page.locator("#admin-main").getByRole("alert")).toHaveCount(0);
    const data = await (
      await request.get(`${api}/admin/resources/${resource.key}`, { headers })
    ).json();
    if (data.items.length) {
      await page.goto(`/en/admin/${resource.key}/${data.items[0]._id}`);
      await expect(
        page.getByRole("heading", {
          name:
            resource.key === "products"
              ? data.items[0].name.en
              : en.AdminExperience.details,
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.locator("#admin-main").getByRole("alert")).toHaveCount(0);
    }
  }
});
test("CMS create, publish and read a translated public page", async ({
  page,
  request,
}) => {
  await page.addInitScript(
    (s) => localStorage.setItem("ioma_auth", JSON.stringify({ state: s, version: 0 })),
    session,
  );
  await page.goto("/en/admin/content?create=1");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const slug = "admin-browser-" + Date.now();
  await dialog.getByLabel(en.AdminExperience.fields.slug, { exact: false }).fill(slug);
  await dialog
    .getByLabel(en.AdminExperience.fields.kind, { exact: false })
    .selectOption("page");
  await dialog
    .getByLabel(en.AdminExperience.fields.status, { exact: false })
    .selectOption("published");
  const title = dialog
    .locator("fieldset")
    .filter({ has: page.locator("legend", { hasText: en.AdminExperience.fields.title }) })
    .first();
  for (const lang of ["EN", "FR", "AR"])
    await title.getByLabel(lang, { exact: true }).fill("Admin browser CMS " + lang);
  await dialog
    .getByRole("button", { name: en.AdminExperience.save, exact: true })
    .click();
  await expect(page).toHaveURL(/admin\/content\/[a-f0-9]{24}/);
  const id = page.url().split("/").pop();
  await page.goto("/en/pages/" + slug);
  await expect(
    page.getByRole("heading", { name: "Admin browser CMS EN", exact: true }),
  ).toBeVisible();
  await request.patch(`${api}/admin/resources/content/${id}`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    data: { status: "draft" },
  });
});
test("guest is redirected from admin to sign in", async ({ page }) => {
  await page.goto("/en/admin");
  await expect(page).toHaveURL(/login/);
});
test("public Admin Panel link appears for an authorized administrator", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.addInitScript(
    (s) => localStorage.setItem("ioma_auth", JSON.stringify({ state: s, version: 0 })),
    session,
  );
  await page.goto("/en/shop");
  await expect(
    page.getByRole("link", { name: en.AdminExperience.adminPanel, exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
  ).toBeTruthy();
  await page
    .getByRole("link", { name: en.AdminExperience.adminPanel, exact: true })
    .click();
  await expect(page).toHaveURL(/\/en\/admin$/);
});
test("customer cannot gain admin access by changing browser roles", async ({
  page,
  request,
}) => {
  const customer = await apiSession(request, `admin-denial-${Date.now()}@example.test`);
  customer.user.roles = ["super_administrator"];
  await page.addInitScript(
    (s) => localStorage.setItem("ioma_auth", JSON.stringify({ state: s, version: 0 })),
    customer,
  );
  await page.goto("/en/shop");
  await expect(
    page.getByRole("link", { name: en.AdminExperience.adminPanel, exact: true }),
  ).toHaveCount(0);
  await page.goto("/en/admin");
  await expect(
    page.getByRole("heading", { name: en.AdminExperience.denied, exact: true }),
  ).toBeVisible();
  const denied = await request.get(`${api}/admin/dashboard/overview`, {
    headers: customer.headers,
  });
  expect(denied.status()).toBe(403);
});
test("mobile inventory detail shows AED prices and editable price fields", async ({
  page,
  request,
}) => {
  const headers = { Authorization: `Bearer ${session.accessToken}` };
  const list = await (
    await request.get(`${api}/admin/resources/inventory`, { headers })
  ).json();
  const item = list.items[0];
  await page.setViewportSize({ width: 390, height: 900 });
  await page.addInitScript(
    (s) => localStorage.setItem("ioma_auth", JSON.stringify({ state: s, version: 0 })),
    session,
  );
  await page.goto(`/en/admin/inventory/${item._id}`);
  await expect(
    page.getByRole("heading", { name: en.AdminExperience.details, exact: true }),
  ).toBeVisible();
  const value = page
    .locator("dl > div")
    .filter({
      has: page.locator("dt", { hasText: en.AdminExperience.fields.b2cPriceMinor }),
    })
    .first()
    .locator("dd");
  await expect(value).toContainText("AED");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
  ).toBeTruthy();
  await page.getByRole("button", { name: en.AdminExperience.edit, exact: true }).click();
  const input = page.getByLabel(en.AdminExperience.fields.b2cPriceMinor, {
    exact: false,
  });
  expect(Number(await input.inputValue())).toBe(item.b2cPriceMinor / 100);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
  ).toBeTruthy();
});
