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

  // Ensure an order exists for tests
  const ordersRes = await request.get(`${api}/admin/resources/orders?limit=1`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  const ordersData = await ordersRes.json();
  if (!ordersData.items || ordersData.items.length === 0) {
    await request.post(`${api}/admin/resources/orders`, {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      data: {
        orderNumber: "IOMA-DEV-" + Math.floor(Math.random() * 100000),
        type: "b2c",
        items: [
          {
            sku: "IOMA-HYDRA-01",
            productNameSnapshot: {
              en: "Sérum Hydratant Optimum",
              fr: "Sérum Hydratant Optimum",
              ar: "سيروم الترطيب",
            },
            qty: 1,
            unitPriceMinorSnapshot: 42000,
            totalMinor: 42000,
          },
        ],
        subtotalMinor: 42000,
        taxMinor: 2100,
        shippingMinor: 0,
        totalMinor: 44100,
        currency: "AED",
        shippingAddress: {
          fullName: "Sarah Customer",
          phone: "+971501234567",
          emirate: "Dubai",
          city: "Dubai",
          addressLine1: "Downtown Boulevard, Tower 1",
          addressLine2: "Apt 1204",
        },
        billingAddress: {
          fullName: "Sarah Customer",
          phone: "+971501234567",
          emirate: "Dubai",
          city: "Dubai",
          addressLine1: "Downtown Boulevard, Tower 1",
          addressLine2: "Apt 1204",
        },
        paymentStatus: "paid",
        fulfillmentStatus: "pending",
      },
    });
  }
});

test.describe("Admin Orders & Edit Drawer E2E", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => console.log(`[PAGE LOG ${msg.type()}]:`, msg.text()));
    page.on("pageerror", (err) => console.log(`[PAGE ERROR]:`, err.message, err.stack));
    await page.addInitScript(
      (s) => localStorage.setItem("ioma_auth", JSON.stringify({ state: s, version: 0 })),
      session,
    );
  });

  test("Orders list page renders status counter tabs, search, and dense table", async ({
    page,
  }) => {
    await page.goto("/en/admin/orders");

    // 1. Verify Page Heading
    await expect(page.getByRole("heading", { name: /^orders$/i })).toBeVisible();

    // 2. Verify Status Navigation Tabs / Counters
    await expect(page.getByRole("button", { name: /^all/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^pending/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^processing/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^shipped/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^delivered/i })).toBeVisible();

    // 3. Verify Search Bar and Channel Filter
    const searchInput = page.getByPlaceholder(/search orders \(number/i);
    await expect(searchInput).toBeVisible();

    const table = page.locator("table");
    await expect(table).toBeVisible();
  });

  test("Clicking an order row opens right-side Drawer in View Mode without navigation", async ({
    page,
  }) => {
    await page.goto("/en/admin/orders");

    // Click the first order row if any exists
    const firstRow = page.locator("tbody tr[class*='cursor-pointer']").first();
    await expect(firstRow).toBeVisible();
    await firstRow.click();

    // Verify right-side Drawer opens without navigating away
    const drawer = page.locator('[data-slot="sheet-content"]');
    await expect(drawer).toBeVisible();
    await expect(page).toHaveURL(/\/en\/admin\/orders/);

    // Verify sticky header elements
    await expect(drawer.getByRole("button", { name: /edit order/i })).toBeVisible();

    // Verify sections inside drawer
    await expect(drawer.getByText(/order details & status/i)).toBeVisible();
    await expect(drawer.getByText(/shipping & delivery details/i)).toBeVisible();
    await expect(drawer.getByText(/customer details/i)).toBeVisible();
    await expect(drawer.getByText(/order items/i)).toBeVisible();
  });

  test("Editing order inside Drawer and saving updates database and UI", async ({
    page,
  }) => {
    await page.goto("/en/admin/orders");

    const firstRow = page.locator("tbody tr[class*='cursor-pointer']").first();
    await firstRow.click();

    const drawer = page.locator('[data-slot="sheet-content"]');
    await expect(drawer).toBeVisible();

    // Click Edit Order button
    await drawer.getByRole("button", { name: /edit order/i }).click();

    // Verify form inputs appear
    const trackingInput = drawer.getByPlaceholder(/e\.g\. AWB-/i);
    await expect(trackingInput).toBeVisible();

    // Add a tracking number
    const testTracking = "TRK-" + Math.floor(Math.random() * 1000000);
    await trackingInput.fill(testTracking);

    // Save Changes
    await drawer.getByRole("button", { name: /save changes/i }).click();

    // Verify drawer switches back to View Mode with updated tracking number
    await expect(drawer.getByRole("button", { name: /edit order/i })).toBeVisible();
    await expect(drawer.getByText(testTracking)).toBeVisible();
  });

  test("Unsaved changes alert dialog appears on dirty drawer cancel", async ({
    page,
  }) => {
    await page.goto("/en/admin/orders");

    const firstRow = page.locator("tbody tr[class*='cursor-pointer']").first();
    await firstRow.click();

    const drawer = page.locator('[data-slot="sheet-content"]');
    await expect(drawer).toBeVisible();

    // Switch to edit mode and change tracking input
    await drawer.getByRole("button", { name: /edit order/i }).click();
    const trackingInput = drawer.getByPlaceholder(/e\.g\. AWB-/i);
    await trackingInput.fill("UnsavedTracking123");

    // Click Cancel
    await drawer.getByRole("button", { name: /^cancel$/i }).click();

    // Verify Unsaved Changes warning dialog appears
    const alertModal = page.getByRole("dialog").filter({ hasText: /unsaved changes/i });
    await expect(alertModal).toBeVisible();

    // Click Continue Editing
    await alertModal.getByRole("button", { name: /continue editing/i }).click();
    await expect(drawer).toBeVisible();
    await expect(trackingInput).toHaveValue("UnsavedTracking123");

    // Click Cancel again and Discard
    await drawer.getByRole("button", { name: /^cancel$/i }).click();
    await alertModal.getByRole("button", { name: /discard changes/i }).click();
    await expect(drawer.getByRole("button", { name: /edit order/i })).toBeVisible();
  });

  test("Delete order option displays confirmation modal in drawer", async ({ page }) => {
    await page.goto("/en/admin/orders");

    const firstRow = page.locator("tbody tr[class*='cursor-pointer']").first();
    await firstRow.click();

    const drawer = page.locator('[data-slot="sheet-content"]');
    await expect(drawer).toBeVisible();

    // Click Delete button in drawer header
    const deleteBtn = drawer.getByRole("button", { name: /delete/i });
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    // Verify Delete confirmation dialog appears
    const deleteModal = page.getByRole("dialog").filter({ hasText: /delete order/i });
    await expect(deleteModal).toBeVisible();
    await expect(
      deleteModal.getByRole("button", { name: /confirm delete/i }),
    ).toBeVisible();

    // Cancel deletion
    await deleteModal.getByRole("button", { name: /cancel/i }).click();
    await expect(deleteModal).toHaveCount(0);
  });

  test("Orders workspace and drawer are responsive at 390px mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/admin/orders");

    // Verify no horizontal document overflow
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    ).toBeTruthy();

    // Open Drawer
    const firstRow = page.locator("tbody tr[class*='cursor-pointer']").first();
    await firstRow.click();

    const drawer = page.locator('[data-slot="sheet-content"]');
    await expect(drawer).toBeVisible();

    // Verify no document overflow while drawer is open
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    ).toBeTruthy();
  });
});
