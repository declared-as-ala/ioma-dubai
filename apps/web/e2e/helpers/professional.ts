import { expect, type Page, type APIRequestContext } from "@playwright/test";
import en from "../../messages/en.json";
import fr from "../../messages/fr.json";
import ar from "../../messages/ar.json";

export const dictionaries = { en, fr, ar };
export const API = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:4000/api";
export const password = "Password123!";
export const document = {
  name: "trade-licence.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1ioAAAAASUVORK5CYII=",
    "base64",
  ),
};
export const details = {
  companyName: "Regression Spa",
  contactPerson: "Professional Owner",
  businessType: "spa",
  tradeLicenceNumber: "TL-DXB-12345",
  email: "professional@example.com",
  phone: "+971501234567",
  address: "Dubai Marina",
  emirate: "DXB",
  city: "Dubai",
  locationsCount: 2,
  expectedOrderVolume: "5000 AED",
  termsAccepted: true,
};

export async function registerViaApplication(
  page: Page,
  locale: keyof typeof dictionaries,
  email: string,
) {
  const t = dictionaries[locale];
  await page.goto(`/${locale}/login`);
  await page.getByRole("button", { name: t.Login.proTab, exact: true }).click();
  await page.getByRole("link", { name: t.Login.applyLink }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/professionals/apply$`));
  await page.getByRole("link", { name: t.Professionals.apply.account.register }).click();
  await page.locator("#register-firstname").fill("Professional");
  await page.locator("#register-lastname").fill("Owner");
  await page.locator("#register-email").fill(email);
  await page.locator("#register-password").fill(password);
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/auth/register") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: t.Register.submit, exact: true }).click();
  const session = await (await response).json();
  expect(session.accessToken).toBeTruthy();
  await expect(page).toHaveURL(new RegExp(`/${locale}/professionals/apply$`));
  await expect(page.locator("#companyName")).toBeVisible();
  return session as { accessToken: string; user: { id: string } };
}

export async function fillApplication(page: Page, company: string) {
  for (const [id, value] of Object.entries({ ...details, companyName: company })) {
    if (["businessType", "emirate", "termsAccepted", "email"].includes(id)) continue;
    await page.locator(`#${id}`).fill(String(value));
  }
  await page.locator("#businessType").selectOption("spa");
  await page.locator("#emirate").selectOption("DXB");
  await page.locator("#termsAccepted").check();
}

export async function apiSession(request: APIRequestContext, email?: string) {
  const options = {
    data: email
      ? { email, password, firstName: "Test", lastName: "Professional", locale: "en" }
      : {
          email: process.env.E2E_ADMIN_EMAIL ?? "admin@ioma-dev.local",
          password: process.env.E2E_ADMIN_PASSWORD ?? "ChangeMe123!",
        },
  };
  let response = await request.post(
    `${API}/auth/${email ? "register" : "login"}`,
    options,
  );
  // Respect the real signup/login throttle while provisioning the state matrix.
  for (let attempt = 0; response.status() === 429 && attempt < 5; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 15_000));
    response = await request.post(`${API}/auth/${email ? "register" : "login"}`, options);
  }
  expect(response.ok(), await response.text()).toBeTruthy();
  const session = await response.json();
  return { ...session, headers: { Authorization: `Bearer ${session.accessToken}` } };
}
