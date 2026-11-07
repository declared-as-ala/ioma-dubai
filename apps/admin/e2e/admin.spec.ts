import { expect, test } from "@playwright/test";

test("Sprint 10: Admin Dashboard & Control Panel journey", async ({ page }) => {
  // 1. Sign in as Admin
  await page.goto("/en/login");
  await page.getByLabel(/^email$/i).fill("admin@ioma-dev.local");
  await page.getByLabel(/^password$/i).fill("ChangeMe123!");
  await page.getByRole("button", { name: /sign in/i }).click();

  await expect(page).toHaveURL(/\/en\/account$/);

  // 2. Navigate to Admin Dashboard
  await page.goto("/en/admin");
  await expect(page.getByRole("heading", { name: /^platform overview$/i })).toBeVisible();

  // 3. Navigate to Admin Products Management
  await page.goto("/en/admin/products");
  await expect(page.getByRole("heading", { name: /^products$/i })).toBeVisible();

  // 4. Navigate to Admin Orders Operations
  await page.goto("/en/admin/orders");
  await expect(page.getByRole("heading", { name: /^orders$/i })).toBeVisible();

  // 5. Navigate to Admin Partners Directory
  await page.goto("/en/admin/partners");
  await expect(page.getByRole("heading", { name: /partners/i })).toBeVisible();

  // 6. Navigate to Admin Audit Logs
  await page.goto("/en/admin/audit");
  await expect(page.getByRole("heading", { name: /audit/i })).toBeVisible();
});
