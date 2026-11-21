import { expect, test } from "@playwright/test";

// Sprint 4 acceptance criteria (SPRINTS.md): "guest can browse -> add to
// cart -> checkout -> mock-pay -> see confirmation" and a mock
// payment-failure/retry path. Runs against a real build (Docker or `pnpm
// build && pnpm start`), not dev mode — PDP/cart/checkout are Client
// Components that fetch from the real API after hydration, so only an
// actual browser run (not a curl/status-code check) proves the flow works.

test("guest can browse, add to cart, checkout, and see a paid confirmation", async ({
  page,
}) => {
  await page.goto("/en/shop");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const firstProduct = page.locator("main a[href^='/en/shop/']").first();
  await expect(firstProduct).toBeVisible();
  await firstProduct.click();

  await expect(page).toHaveURL(/\/en\/shop\/.+/);
  await page.getByRole("button", { name: /add to cart/i }).click();

  // Cart drawer opens on add — go to full checkout from there.
  await page.getByRole("link", { name: /checkout/i }).click();
  await expect(page).toHaveURL(/\/en\/checkout/);

  // Step 1: address
  await page.getByLabel(/email address/i).fill("jane.doe@example.test");
  await page.getByLabel(/full name/i).fill("Jane Doe");
  await page.getByLabel(/phone/i).fill("+971501234567");
  await page.getByLabel(/emirate/i).click();
  await page.getByRole("option", { name: "Dubai" }).click();
  await page.getByLabel(/^city$/i).fill("Dubai");
  await page.getByLabel(/^address$/i).fill("Marina Walk, Tower 3");
  await page.getByRole("button", { name: /continue/i }).click();

  // Step 2: delivery
  await expect(page.getByRole("radio", { name: /standard/i })).toBeVisible();
  await page.getByRole("button", { name: /continue/i }).click();

  // Step 3: payment — demo banner must be visible (CLAUDE.md: mock modes
  // must be clearly labeled).
  await expect(page.getByRole("status")).toContainText(/demo mode/i);
  await page.getByRole("button", { name: /simulate successful payment/i }).click();

  await expect(page).toHaveURL(/\/en\/checkout\/confirmation\/IOMA-/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/confirmed/i);
});

test("a declined mock payment shows a failed state, and retry succeeds", async ({
  page,
}) => {
  await page.goto("/en/shop");
  const firstProduct = page.locator("main a[href^='/en/shop/']").first();
  await firstProduct.click();
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.getByRole("link", { name: /checkout/i }).click();

  await page.getByLabel(/email address/i).fill("failed.case@example.test");
  await page.getByLabel(/full name/i).fill("Failed Case");
  await page.getByLabel(/phone/i).fill("+971501234567");
  await page.getByLabel(/emirate/i).click();
  await page.getByRole("option", { name: "Sharjah" }).click();
  await page.getByLabel(/^city$/i).fill("Sharjah");
  await page.getByLabel(/^address$/i).fill("Test Street 1");
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();

  await page.getByRole("button", { name: /simulate failed payment/i }).click();

  await expect(page).toHaveURL(/\/en\/checkout\/confirmation\/IOMA-/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    /did not go through/i,
  );

  const retryButton = page.getByRole("button", { name: /retry payment/i });
  await expect(retryButton).toBeVisible();
  await retryButton.click();

  await expect(page.getByRole("heading", { level: 1 })).toContainText(/confirmed/i);
});
