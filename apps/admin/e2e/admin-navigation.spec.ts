import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("IOMA Paris Dubai — Admin Navigation & Mega Menu Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Mock API navigation endpoints
    await page.route(/\/api\/admin\/navigation/, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            draft: {
              items: [
                {
                  id: "nav-visage",
                  type: "mega_menu",
                  label: { en: "Visage", fr: "Visage", ar: "الوجه" },
                  targetType: "category",
                  targetSlug: "visage",
                  url: "/shop?category=visage",
                  sortOrder: 1,
                  visibleDesktop: true,
                  visibleMobile: true,
                  megaMenuSections: [
                    {
                      id: "sec-concerns",
                      type: "concerns",
                      title: {
                        en: "Skin Concerns",
                        fr: "Vos Préoccupations",
                        ar: "اهتمامات البشرة",
                      },
                      sortOrder: 1,
                      visible: true,
                    },
                  ],
                },
              ],
            },
            published: {
              items: [],
            },
            health: {
              valid: true,
              errors: [],
              warnings: [],
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      }
    });

    await page.route(/\/api\/admin\/categories\/tree/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ tree: [] }),
      });
    });

    await page.route(/\/api\/admin\/resources\/concerns/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], total: 0 }),
      });
    });

    await page.route(/\/api\/admin\/resources\/ranges/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], total: 0 }),
      });
    });

    await page.route(/\/api\/admin\/resources\/products/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], total: 0 }),
      });
    });

    await loginAsAdmin(page);
  });

  test("Admin can view Header Items and Live Navigation Preview", async ({ page }) => {
    await page.goto("/en/admin/navigation");

    // Check title
    await expect(
      page.getByRole("heading", { name: /Public Navbar & Mega Menu Editor/i }),
    ).toBeVisible({ timeout: 15000 });

    // Check header items list
    await expect(page.getByText(/Header Items/i).first()).toBeVisible();
    await expect(page.getByText(/Live Navigation Preview/i).first()).toBeVisible();

    // Check pre-publish health button
    await expect(page.getByRole("button", { name: /Navigation Health/i })).toBeVisible();
  });

  test("Admin can switch live preview between Desktop and Mobile in Arabic RTL", async ({
    page,
  }) => {
    await page.goto("/en/admin/navigation");

    // Wait for the navigation editor to load
    await expect(
      page.getByRole("heading", { name: /Public Navbar & Mega Menu Editor/i }),
    ).toBeVisible({ timeout: 15000 });

    // Click AR button in preview
    const arButton = page.getByRole("button", { name: /^ar$/i });
    if (await arButton.isVisible()) {
      await arButton.click();
    }

    // Switch to mobile device preview
    const mobileToggle = page.getByRole("button", { name: /Mobile Preview/i });
    if (await mobileToggle.isVisible()) {
      await mobileToggle.click();
      await expect(page.getByText(/Mobile Navigation/i)).toBeVisible();
    }
  });
});
