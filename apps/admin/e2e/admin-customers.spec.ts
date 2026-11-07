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

test.describe("Admin Customers & View/Edit Drawer E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(
      (s) => localStorage.setItem("ioma_auth", JSON.stringify({ state: s, version: 0 })),
      session,
    );
  });

  test("Customer List renders KPI metrics, search, and dense table", async ({ page }) => {
    await page.goto("/en/admin/customers");

    // 1. Verify Page Heading & KPI metrics
    await expect(page.getByRole("heading", { name: /^customers$/i })).toBeVisible();
    await expect(page.getByText(/total customers/i)).toBeVisible();
    await expect(page.getByText(/new this month/i)).toBeVisible();
    await expect(page.getByText(/active customers/i)).toBeVisible();
    await expect(
      page.locator("span").filter({ hasText: /^with orders$/i }),
    ).toBeVisible();

    // 2. Verify Search input and filters
    const searchInput = page.getByPlaceholder(/search customers by name/i);
    await expect(searchInput).toBeVisible();

    // Verify table has rendered customer rows
    const firstRow = page.locator("tbody tr[class*='cursor-pointer']").first();
    await expect(firstRow).toBeVisible();
  });

  test("Clicking a customer opens right-side Drawer in View Mode with 9 tabs", async ({
    page,
  }) => {
    await page.goto("/en/admin/customers");

    // Click the first customer row
    const firstRow = page.locator("tbody tr[class*='cursor-pointer']").first();
    await expect(firstRow).toBeVisible();
    await firstRow.click();

    // Verify right-side Drawer opens without navigating away
    const drawer = page.locator('[data-slot="sheet-content"]');
    await expect(drawer).toBeVisible();
    await expect(page).toHaveURL(/\/en\/admin\/customers/);

    // Verify sticky header elements
    await expect(drawer.getByRole("button", { name: /^edit$/i })).toBeVisible();

    // Verify tabs navigation
    await expect(drawer.getByRole("button", { name: /^overview$/i })).toBeVisible();
    await expect(drawer.getByRole("button", { name: /orders/i })).toBeVisible();
    await expect(drawer.getByRole("button", { name: /addresses/i })).toBeVisible();
    await expect(drawer.getByRole("button", { name: /skin & diagnosis/i })).toBeVisible();
    await expect(drawer.getByRole("button", { name: /appointments/i })).toBeVisible();
    await expect(drawer.getByRole("button", { name: /wishlist/i })).toBeVisible();
    await expect(drawer.getByRole("button", { name: /^security$/i })).toBeVisible();
    await expect(drawer.getByRole("button", { name: /^activity$/i })).toBeVisible();

    // Switch to Addresses tab
    await drawer.getByRole("button", { name: /addresses/i }).click();
    await expect(drawer.getByRole("heading", { name: /saved addresses/i })).toBeVisible();

    // Switch to Skin & Diagnosis tab
    await drawer.getByRole("button", { name: /skin & diagnosis/i }).click();
    await expect(drawer.getByText(/skin diagnoses/i)).toBeVisible();

    // Switch to Orders tab
    await drawer.getByRole("button", { name: /orders/i }).click();
    await expect(drawer.getByText(/order history/i)).toBeVisible();

    // Switch to Security tab
    await drawer.getByRole("button", { name: /^security$/i }).click();
    await expect(drawer.getByText(/account security controls/i)).toBeVisible();

    // Close drawer
    await drawer.locator("button:has(svg.lucide-x)").first().click();
    await expect(drawer).toHaveCount(0);
  });

  test("Editing customer inside Drawer and saving updates MongoDB & UI", async ({
    page,
  }) => {
    await page.goto("/en/admin/customers");

    // Open first customer
    const firstRow = page.locator("tbody tr[class*='cursor-pointer']").first();
    await firstRow.click();

    const drawer = page.locator('[data-slot="sheet-content"]');
    await expect(drawer).toBeVisible();

    // Click Edit button
    await drawer.getByRole("button", { name: /^edit$/i }).click();

    // Verify form inputs appear
    const firstNameInput = drawer.locator('input[type="text"]').first();
    await expect(firstNameInput).toBeVisible();

    // Modify First Name
    const updatedName = "SarahEdited";
    await firstNameInput.fill(updatedName);

    // Save Changes
    await drawer.getByRole("button", { name: /save changes/i }).click();

    // Verify drawer switches back to View Mode with updated name
    await expect(drawer.getByText(updatedName).first()).toBeVisible();
    await expect(drawer.getByRole("button", { name: /^edit$/i })).toBeVisible();

    // Revert edit back to clean state
    await drawer.getByRole("button", { name: /^edit$/i }).click();
    await firstNameInput.fill("Sarah");
    await drawer.getByRole("button", { name: /save changes/i }).click();
    await expect(drawer.getByRole("button", { name: /^edit$/i })).toBeVisible();
  });

  test("Unsaved changes guard prompts before discarding edits", async ({ page }) => {
    await page.goto("/en/admin/customers");

    const firstRow = page.locator("tbody tr[class*='cursor-pointer']").first();
    await firstRow.click();

    const drawer = page.locator('[data-slot="sheet-content"]');
    await expect(drawer).toBeVisible();

    // Switch to edit mode and change a field
    await drawer.getByRole("button", { name: /^edit$/i }).click();
    const firstNameInput = drawer.locator('input[type="text"]').first();
    await firstNameInput.fill("UnsavedChange");

    // Click Cancel
    await drawer.getByRole("button", { name: /^cancel$/i }).click();

    // Verify Unsaved Changes warning dialog appears
    const alertModal = page.getByRole("dialog").filter({ hasText: /unsaved changes/i });
    await expect(alertModal).toBeVisible();

    // Click Continue Editing
    await alertModal.getByRole("button", { name: /continue editing/i }).click();
    await expect(drawer).toBeVisible();
    await expect(firstNameInput).toHaveValue("UnsavedChange");

    // Click Cancel again and Discard
    await drawer.getByRole("button", { name: /^cancel$/i }).click();
    await alertModal.getByRole("button", { name: /discard changes/i }).click();
    await expect(drawer).toHaveCount(0);
  });

  test("Customer Management is fully responsive at 390px mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/admin/customers");

    // Verify no horizontal document overflow
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    ).toBeTruthy();

    // Open Drawer
    const firstRow = page.locator("tbody tr[class*='cursor-pointer']").first();
    await firstRow.click();

    const drawer = page.locator('[data-slot="sheet-content"]');
    await expect(drawer).toBeVisible();

    // Verify drawer tabs scroll horizontally and remain accessible
    await expect(drawer.getByRole("button", { name: /^overview$/i })).toBeVisible();
    await expect(drawer.getByRole("button", { name: /orders/i })).toBeVisible();

    // Verify no document overflow while drawer is open
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    ).toBeTruthy();
  });
});
