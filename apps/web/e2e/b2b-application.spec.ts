import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import {
  API,
  dictionaries,
  document,
  fillApplication,
  registerViaApplication,
  password,
} from "./helpers/professional";

test.describe.configure({ mode: "serial" });

for (const locale of ["fr", "en", "ar"] as const) {
  for (const width of [390, 768, 1440]) {
    test(`${locale} ${width}px: partner CTA changes URL and opens existing application`, async ({
      page,
    }, info) => {
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      const t = dictionaries[locale];
      await page.goto(`/${locale}/login`);
      await page.getByRole("button", { name: t.Login.proTab, exact: true }).click();
      const cta = page.getByRole("link", { name: t.Login.applyLink });
      await expect(cta).toBeVisible({ timeout: 15000 });
      await expect(cta).toHaveAttribute("href", `/${locale}/professionals/apply`);
      expect((await cta.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await cta.focus();
      await expect(cta).toBeFocused();
      await page.screenshot({
        path: info.outputPath("login-partner.png"),
        fullPage: true,
      });
      await cta.click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/professionals/apply$`));
      await expect(
        page.getByRole("heading", { name: t.Professionals.apply.title, exact: true }),
      ).toBeVisible({ timeout: 15000 });
      await expect(
        page.getByRole("link", { name: t.Professionals.apply.account.register }),
      ).toBeVisible({ timeout: 15000 });
      expect(
        await page.evaluate(
          () => window.document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      await expect(page.locator("html")).toHaveAttribute(
        "dir",
        locale === "ar" ? "rtl" : "ltr",
      );
      await page.screenshot({
        path: info.outputPath("application-entry.png"),
        fullPage: true,
      });
      expect(errors).toEqual([]);
    });
  }
}

for (const [locale, width] of [
  ["en", 1440],
  ["fr", 768],
  ["ar", 390],
] as const) {
  test(`${locale}: visitor → private upload → submission → MongoDB → admin → approval`, async ({
    page,
    browser,
    request,
  }, info) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    const t = dictionaries[locale];
    const company = `B2B ${locale} ${Date.now()}`;
    const email = `b2b-${locale}-${Date.now()}@example.com`;
    const errors: string[] = [];
    const failedResponses: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("response", (response) => {
      if (response.status() >= 400)
        failedResponses.push(`${response.status()} ${response.url()}`);
    });
    const applicant = await registerViaApplication(page, locale, email);
    const headers = { Authorization: `Bearer ${applicant.accessToken}` };
    expect((await request.get(`${API}/pro/catalog`, { headers })).status()).toBe(403);
    await fillApplication(page, company);
    await page.locator("#application-document").setInputFiles(document);
    await expect(
      page.getByText(`${document.name} — ${t.Professionals.apply.documents.uploaded}`, {
        exact: true,
      }),
    ).toBeVisible({ timeout: 15000 });
    expect(
      await page.evaluate(
        () => window.document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBeTruthy();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: info.outputPath("application-form.png"),
      fullPage: true,
    });
    let submits = 0;
    page.on("request", (r) => {
      if (r.url().endsWith("/submit") && r.method() === "POST") submits++;
    });
    await page
      .getByRole("button", { name: t.Professionals.apply.actions.submit, exact: true })
      .click({ clickCount: 2 });
    await expect(page.getByTestId("application-status")).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: t.Professionals.apply.success.title }),
    ).toBeVisible({ timeout: 15000 });
    expect(submits).toBe(1);
    const id = (await page.getByTestId("application-reference").innerText()).trim();
    await page.reload();
    await expect(page.getByTestId("application-reference")).toHaveText(id);
    expect((await request.get(`${API}/pro/catalog`, { headers })).status()).toBe(403);
    const records = await (
      await request.get(`${API}/professional/applications`, { headers })
    ).json();
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      _id: id,
      status: "submitted",
      companyName: company,
    });
    expect(records[0].documents).toHaveLength(1);
    expect(records[0].termsAcceptedAt).toBeTruthy();
    // Read the persisted record directly, independently of the API response.
    const stored = execFileSync(
      "docker",
      [
        "exec",
        "ioma-dev-mongo-1",
        "mongosh",
        "ioma",
        "--quiet",
        "--eval",
        `JSON.stringify(db.professionalapplications.findOne({_id:ObjectId('${id}')}))`,
      ],
      { encoding: "utf8" },
    );
    expect(JSON.parse(stored)).toMatchObject({
      companyName: company,
      status: "submitted",
    });
    await page.screenshot({
      path: info.outputPath("application-confirmation.png"),
      fullPage: true,
    });

    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    adminPage.on("pageerror", (error) => errors.push(error.message));
    adminPage.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    adminPage.on("response", (response) => {
      if (response.status() >= 400)
        failedResponses.push(`${response.status()} ${response.url()}`);
    });
    await adminPage.goto("/en/login");
    await adminPage
      .locator("#login-email")
      .fill(process.env.E2E_ADMIN_EMAIL ?? "admin@ioma-dev.local");
    await adminPage
      .locator("#login-password")
      .fill(process.env.E2E_ADMIN_PASSWORD ?? "ChangeMe123!");
    const adminResponse = adminPage.waitForResponse(
      (r) => r.url().endsWith("/auth/login") && r.request().method() === "POST",
    );
    await adminPage.getByRole("button", { name: "Sign in", exact: true }).click();
    const adminSession = await (await adminResponse).json();
    await adminPage.goto("/en/admin/professionals");
    const row = adminPage.getByTestId(`admin-application-${id}`);
    await expect(row).toContainText(company);
    await expect(row).toContainText(email);
    await row.getByRole("button", { name: document.name, exact: true }).click();
    const signedLink = adminPage.getByRole("link", {
      name: "View document",
      exact: true,
    });
    await expect(signedLink).toBeVisible({ timeout: 15000 });
    const signedUrl = (await signedLink.getAttribute("href"))!;
    expect(signedUrl).toContain("X-Amz-Signature");
    const downloaded = await request.get(signedUrl);
    expect(downloaded.ok()).toBeTruthy();
    expect(await downloaded.body()).toEqual(document.buffer);
    const unsigned = new URL(signedUrl);
    unsigned.search = "";
    expect((await request.get(unsigned.toString())).status()).toBe(403);

    if (locale === "en") {
      await row.getByRole("button", { name: "Request documents", exact: true }).click();
      await adminPage.locator("#reviewNotes").fill("Please provide a renewed licence.");
      await adminPage
        .getByRole("dialog")
        .getByRole("button", { name: "Request documents", exact: true })
        .click();
      await expect(adminPage.getByRole("dialog")).not.toBeVisible();
      await page.reload();
      await expect(page.getByText("Please provide a renewed licence.")).toBeVisible({
        timeout: 15000,
      });
      await expect(page.locator("#companyName")).toHaveValue(company);
      await page
        .locator("#application-document")
        .setInputFiles({ ...document, name: "renewed-licence.png" });
      await expect(
        page.getByText("renewed-licence.png — Uploaded", { exact: true }),
      ).toBeVisible({ timeout: 15000 });
      await page.locator("#termsAccepted").check();
      await page.getByRole("button", { name: "Submit Application", exact: true }).click();
      await expect(page.getByTestId("application-status")).toBeVisible({
        timeout: 15000,
      });
      await adminPage.reload();
    }
    await row.getByRole("button", { name: "Approve", exact: true }).click();
    await adminPage
      .getByRole("dialog")
      .getByRole("button", { name: "Approve", exact: true })
      .click();
    await expect(row).not.toBeVisible();
    await page.goto(`/${locale}/login`);
    await page.locator("#login-email").fill(email);
    await page.locator("#login-password").fill(password);
    await page.getByRole("button", { name: t.Login.proTab, exact: true }).click();
    const approvedLoginResponse = page.waitForResponse(
      (r) => r.url().endsWith("/auth/login") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: t.Login.submit, exact: true }).click();
    expect((await approvedLoginResponse).ok()).toBeTruthy();
    await expect(page).toHaveURL(new RegExp(`/${locale}/portal$`), { timeout: 15000 });
    expect((await request.get(`${API}/pro/catalog`, { headers })).status()).toBe(200);
    // Suspension must revoke even the original JWT immediately.
    expect(adminSession.accessToken).toBeTruthy();
    const profile = execFileSync(
      "docker",
      [
        "exec",
        "ioma-dev-mongo-1",
        "mongosh",
        "ioma",
        "--quiet",
        "--eval",
        `JSON.stringify(db.professionalprofiles.findOne({applicationId:ObjectId('${id}')}))`,
      ],
      { encoding: "utf8" },
    );
    await adminPage.reload();
    const approvedProfile = adminPage.getByTestId(
      `approved-profile-${JSON.parse(profile)._id}`,
    );
    await approvedProfile
      .getByRole("button", { name: "Suspend access", exact: true })
      .click();
    await adminPage
      .locator("#suspension-reason")
      .fill("Regression verification complete");
    const suspensionResponse = adminPage.waitForResponse(
      (r) => r.url().endsWith("/suspend") && r.request().method() === "PATCH",
    );
    await adminPage
      .getByRole("button", { name: "Confirm suspension", exact: true })
      .click();
    expect((await suspensionResponse).ok()).toBeTruthy();
    await expect(approvedProfile).not.toBeVisible();
    expect((await request.get(`${API}/pro/catalog`, { headers })).status()).toBe(403);
    await page.goto(`/${locale}/professionals/apply`);
    await expect(page.getByTestId("application-status")).toContainText(
      t.Professionals.apply.statuses.suspended,
    );
    await adminContext.close();
    expect(errors).toEqual([]);
    expect(failedResponses).toEqual([]);
  });
}
