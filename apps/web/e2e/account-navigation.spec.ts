import { expect, test } from "@playwright/test";

test("customer can manage the full account journey and sign out", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const email = `account-${Date.now()}@example.com`;
  const originalPassword = "AccountTest1!";
  const newPassword = "UpdatedTest2!";

  await page.goto("/en/register");
  await page.getByLabel(/first name/i).fill("Account");
  await page.getByLabel(/last name/i).fill("Customer");
  await page.getByLabel(/^email$/i).fill(email);
  await page.getByLabel(/^password$/i).fill(originalPassword);
  await page.getByRole("button", { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/en\/account$/, { timeout: 15000 });
  await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  await expect(page.getByText(/welcome back, account/i)).toBeVisible();

  await page
    .getByRole("link", { name: /^profile$/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/en\/account\/profile$/);
  await page.getByLabel(/first name/i).fill("Updated");
  await page.getByLabel(/phone/i).fill("+971501234567");
  await page.getByLabel(/date of birth/i).fill("1990-06-15");
  await page.getByLabel(/send me skin science/i).check();
  await page.getByRole("button", { name: /save changes/i }).click();
  await expect(page.getByRole("status")).toContainText(/profile updated/i);

  await page
    .getByRole("link", { name: /^addresses$/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/en\/account\/addresses$/);
  await page.getByRole("button", { name: /add an address/i }).click();
  await page.getByLabel(/label/i).fill("Home");
  await page.getByLabel(/full name/i).fill("Updated Customer");
  await page.getByLabel(/^phone$/i).fill("+971501234567");
  await page.getByLabel(/^address$/i).fill("Marina Walk, Tower 3");
  await page.getByLabel(/emirate/i).click();
  await page.getByRole("option", { name: "Dubai" }).click();
  await page.getByLabel(/^city$/i).fill("Dubai");
  await page.getByLabel(/set as default/i).check();
  await page.getByRole("button", { name: /save address/i }).click();
  await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();
  await expect(page.getByText("Default", { exact: true })).toBeVisible();

  await page
    .getByRole("link", { name: /^orders$/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/en\/account\/orders$/);
  await expect(page.getByRole("heading", { name: /order history/i })).toBeVisible();

  await page
    .getByRole("link", { name: /^wishlist$/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/en\/account\/wishlist$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto("/en/account/delete");
  await expect(page.getByRole("heading", { name: /delete account/i })).toBeVisible();
  await expect(page.getByText(/isn't deleted immediately/i)).toBeVisible();

  await page.getByRole("button", { name: /request account deletion/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: /keep/i }).click();

  await page.goto("/en/account/security");
  await page.getByLabel(/current password/i).fill("WrongPassword1!");
  await page.getByLabel(/new password/i).fill(newPassword);
  await page.getByRole("button", { name: /change password/i }).click();
  await expect(page.getByText(/current password is incorrect/i)).toBeVisible();

  await page.getByLabel(/current password/i).fill(originalPassword);
  await page.getByRole("button", { name: /change password/i }).click();
  await expect(page.getByRole("status")).toContainText(/password has been changed/i);

  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/en\/login$/);

  await page.goto("/en/account");
  await expect(page).toHaveURL(/\/en\/login$/);
});
