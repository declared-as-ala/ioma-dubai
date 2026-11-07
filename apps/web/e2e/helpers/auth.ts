import { type Page } from "@playwright/test";

export const mockAdminSession = {
  user: {
    id: "660000000000000000000001",
    email: "admin@ioma-dev.local",
    roles: ["administrator", "super_administrator"],
    locale: "en",
    emailVerifiedAt: "2026-01-01T00:00:00.000Z",
  },
  accessToken: "mock-admin-token",
  refreshToken: "mock-refresh-token",
  expiresIn: 3600,
};

export async function loginAsAdmin(page: Page) {
  await page.route("**/api/admin/access**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        canAccess: true,
        user: mockAdminSession.user,
        permissions: [
          "admin.access",
          "catalog.manage",
          "content.manage",
          "content.view",
          "b2b.view",
          "commerce.view",
          "users.manage",
          "analytics.view",
          "system.view",
        ],
        resources: [
          { key: "categories", title: "Categories & Taxonomy", group: "catalog" },
          { key: "ranges", title: "Product Ranges", group: "catalog" },
          { key: "concerns", title: "Skin Concerns", group: "catalog" },
          { key: "products", title: "Products", group: "catalog" },
          { key: "orders", title: "Orders", group: "commerce" },
          { key: "customers", title: "Customers", group: "commerce" },
        ],
      }),
    });
  });

  await page.addInitScript((session) => {
    localStorage.setItem("ioma_auth", JSON.stringify({ state: session, version: 0 }));
  }, mockAdminSession);
}
