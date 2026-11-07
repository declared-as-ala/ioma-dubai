import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/auth";

test.describe("IOMA Paris Dubai — Admin Category & Taxonomy Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Mock API category tree & resources
    await page.route("**/api/admin/categories/tree**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tree: [
            {
              id: "cat-visage",
              slug: "visage",
              name: { en: "Visage", fr: "Visage", ar: "الوجه" },
              sortOrder: 1,
              productCount: 12,
              children: [
                {
                  id: "cat-cleansers",
                  slug: "cleansers",
                  name: { en: "Cleansers", fr: "Nettoyants", ar: "منظفات" },
                  sortOrder: 1,
                  productCount: 4,
                  children: [],
                },
              ],
            },
          ],
        }),
      });
    });

    await page.route("**/api/admin/resources/categories**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              _id: "cat-visage",
              id: "cat-visage",
              slug: "visage",
              name: { en: "Visage", fr: "Visage", ar: "الوجه" },
              sortOrder: 1,
              productCount: 12,
              visibleInShop: true,
              visibleInHeader: true,
              status: "active",
            },
            {
              _id: "cat-cleansers",
              id: "cat-cleansers",
              slug: "cleansers",
              name: { en: "Cleansers", fr: "Nettoyants", ar: "منظفات" },
              sortOrder: 1,
              parentId: "cat-visage",
              productCount: 4,
              visibleInShop: true,
              visibleInHeader: true,
              status: "active",
            },
          ],
          total: 2,
          page: 1,
          limit: 100,
        }),
      });
    });

    await page.route("**/api/admin/resources/products**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [],
          total: 0,
          page: 1,
          limit: 50,
        }),
      });
    });

    await loginAsAdmin(page);
  });

  test("Admin can view categories in Tree View and Table View", async ({ page }) => {
    await page.goto("/en/admin/categories");

    // Header and title check
    await expect(
      page.getByRole("heading", { name: /Category & Subcategory Management/i }),
    ).toBeVisible({ timeout: 15000 });

    // Verify Tree View is active
    await expect(page.getByText(/Taxonomy Hierarchy/i)).toBeVisible();

    // Switch to Table View
    const tableViewBtn = page.getByRole("button", { name: /Table View/i });
    await tableViewBtn.click();

    // Verify table headers exist
    await expect(page.getByRole("columnheader", { name: /Name/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /Slug/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /Parent/i })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: /Products/i })).toBeVisible();
  });

  test("Admin can open Category drawer and view multilingual translation completeness", async ({
    page,
  }) => {
    await page.goto("/en/admin/categories");

    // Click on New Category
    const newCategoryBtn = page.getByRole("button", { name: /New Category/i });
    await expect(newCategoryBtn).toBeVisible({ timeout: 15000 });
    await newCategoryBtn.click();

    // Verify Drawer opens
    await expect(page.getByRole("heading", { name: /Create Category/i })).toBeVisible();
    await expect(page.getByText(/Overview & Hierarchy/i)).toBeVisible();

    // Switch to Translations tab
    const translationsTab = page.getByRole("button", { name: /Translations/i });
    await translationsTab.click();

    await expect(page.getByText(/English \(en\)/i)).toBeVisible();
    await expect(page.getByText(/French \(fr\)/i)).toBeVisible();
    await expect(page.getByText(/Arabic \(العربية\)/i)).toBeVisible();
  });
});
