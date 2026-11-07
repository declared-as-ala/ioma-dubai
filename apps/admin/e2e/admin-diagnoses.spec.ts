import { test, expect } from "@playwright/test";

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

test.describe("Admin Skin Diagnoses & Deprecated Routes E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      (s) => localStorage.setItem("ioma_auth", JSON.stringify({ state: s, version: 0 })),
      session,
    );
  });

  test("Redirect from removed route /admin/diagnoses to /admin/customers", async ({
    page,
  }) => {
    await page.goto("/en/admin/diagnoses");
    await expect(page).toHaveURL(/\/en\/admin\/customers/);
  });

  test("Redirect from deprecated routes /admin/ai-analyses and /admin/routines to /admin/customers", async ({
    page,
  }) => {
    // 1. Visit /en/admin/ai-analyses
    await page.goto("/en/admin/ai-analyses");
    await expect(page).toHaveURL(/\/en\/admin\/customers/);

    // 2. Visit /en/admin/routines
    await page.goto("/en/admin/routines");
    await expect(page).toHaveURL(/\/en\/admin\/customers/);

    // 3. Visit /en/admin/saved-routines
    await page.goto("/en/admin/saved-routines");
    await expect(page).toHaveURL(/\/en\/admin\/customers/);
  });
});
